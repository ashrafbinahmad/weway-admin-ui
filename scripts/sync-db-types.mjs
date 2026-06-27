#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const BACKEND_SCHEMA_PATH = path.resolve(
  PROJECT_ROOT,
  "..",
  "weway-backend",
  "src",
  "db",
  "schema.ts",
);
const OUTPUT_PATH = path.resolve(PROJECT_ROOT, "src", "shared", "db-types.ts");

const TYPE_MAP = {
  uuid: "string",
  text: "string",
  varchar: "string",
  integer: "number",
  numeric: "string",
  boolean: "boolean",
  timestamp: "Date",
  time: "string",
  jsonb: "unknown",
  doublePrecision: "number",
};

const CUSTOM_TYPES = {
  geographyPoint: "{ lng: number; lat: number }",
};

function findMatching(source, startIdx, open, close) {
  let depth = 0;
  for (let i = startIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i++;
        i++;
      }
    }
  }
  return -1;
}

function parseEnums(source) {
  const enums = {};
  const enumStart = /export\s+const\s+(\w+)\s*=\s*pgEnum\(\s*["']([^"']+)["']\s*,\s*/g;
  let match;
  while ((match = enumStart.exec(source)) !== null) {
    const name = match[1];
    const arrStart = source.indexOf("[", match.index + match[0].length);
    if (arrStart === -1) continue;
    const arrEnd = findMatching(source, arrStart, "[", "]");
    if (arrEnd === -1) continue;
    const arrContent = source.slice(arrStart + 1, arrEnd);
    const values = arrContent
      .split(",")
      .map((v) => v.trim().replace(/["'\s]/g, ""))
      .filter(Boolean);
    enums[name] = values;
  }
  return enums;
}

function parseTables(source, enums) {
  const tables = {};
  const tableStart =
    /export\s+const\s+(\w+)\s*=\s*pgTable\(\s*["']([^"']+)["']\s*,\s*/g;

  let match;
  while ((match = tableStart.exec(source)) !== null) {
    const tableVarName = match[1];
    const tableName = match[2];
    const afterNameIdx = match.index + match[0].length;

    const colBlockStart = source.indexOf("{", afterNameIdx);
    if (colBlockStart === -1) continue;
    const colBlockEnd = findMatching(source, colBlockStart, "{", "}");
    if (colBlockEnd === -1) continue;

    const columnsBlock = source.slice(colBlockStart + 1, colBlockEnd);
    const columns = [];

    // Match each line that starts a column: `colName:` (indented)
    const lineRegex = /^\s*(\w+)\s*:/gm;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(columnsBlock)) !== null) {
      const colName = lineMatch[1];
      const colStart = lineMatch.index + lineMatch[0].length;

      // Find the column definition end (the comma at depth 0)
      const colEnd = findColEnd(columnsBlock, colStart);
      const fullCol = colEnd === -1
        ? columnsBlock.slice(colStart).trim()
        : columnsBlock.slice(colStart, colEnd).trim();

      // Extract builder type: the first word before (
      const builderMatch = fullCol.match(/^\s*([\w.]+)\s*\(/);
      if (!builderMatch) continue;
      const builder = builderMatch[1];

      const hasNotNull = /\bnotNull\b/.test(fullCol);
      const isPrimaryKey = /\bprimaryKey\b/.test(fullCol);

      let tsType;
      if (CUSTOM_TYPES[builder]) {
        tsType = CUSTOM_TYPES[builder];
      } else if (enums[builder]) {
        tsType = enums[builder].map((v) => `"${v}"`).join(" | ");
      } else if (TYPE_MAP[builder]) {
        tsType = TYPE_MAP[builder];
      } else {
        tsType = "unknown";
      }

      if (!hasNotNull && !isPrimaryKey) {
        tsType = `${tsType} | null`;
      }

      columns.push({ colName, tsType });
    }

    tables[tableVarName] = { tableName, columns };
  }

  return tables;
}

// Find the end of a column definition (trailing comma at depth 0)
function findColEnd(text, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (depth === 0 && ch === ",") return i;
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") i++;
        i++;
      }
    }
  }
  return -1;
}

function main() {
  if (!fs.existsSync(BACKEND_SCHEMA_PATH)) {
    console.error(
      `Backend schema not found at: ${BACKEND_SCHEMA_PATH}\n` +
        "   Make sure weway-backend is cloned as a sibling directory.",
    );
    process.exit(1);
  }

  const source = fs.readFileSync(BACKEND_SCHEMA_PATH, "utf-8");

  console.log("Parsing backend schema...");
  const enums = parseEnums(source);
  console.log(`  Enums: ${Object.keys(enums).length}`);

  const tables = parseTables(source, enums);
  console.log(`  Tables: ${Object.keys(tables).length}`);

  const exportTypeRegex =
    /export\s+type\s+(\w+)\s*=\s*InferSelectModel\s*<\s*typeof\s+(\w+)\s*>/g;
  const exportedTypes = [];
  let etMatch;
  while ((etMatch = exportTypeRegex.exec(source)) !== null) {
    exportedTypes.push({
      sourceType: etMatch[1],
      tableVar: etMatch[2],
    });
  }
  console.log(`  Exported types: ${exportedTypes.length}`);

  const lines = [
    "// Auto-generated standalone DB types",
    "// Regenerate with: npm run sync:db-types",
    "// Source: weway-backend/src/db/schema.ts",
    "",
  ];

  for (const et of exportedTypes) {
    const table = tables[et.tableVar];
    if (!table) {
      console.warn(`  Skipping "${et.tableVar}" (not parsed)`);
      continue;
    }
    lines.push(`export type ${et.sourceType} = {`);
    for (const col of table.columns) {
      lines.push(`  ${col.colName}: ${col.tsType};`);
    }
    lines.push("};");
    lines.push("");
  }

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf-8");
  console.log(`Generated: ${OUTPUT_PATH}`);
}

main();
