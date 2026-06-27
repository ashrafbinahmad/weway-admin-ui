import { useState } from "react";
import { api } from "../lib/api";

interface FilePickerProps {
  label: string;
  value: string;
  onChange: (fileId: string) => void;
  accept?: string;
  required?: boolean;
}

export function FilePicker({ label, value, onChange, accept = "image/*", required }: FilePickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get signed URL
      const response = await api.post("/files/upload-url", {
        fileName: file.name,
        mimeType: file.type,
      });

      const { signedUrl, fileRecord } = response.data.data;

      // 2. Upload to S3
      await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // 3. Update form data
      onChange(fileRecord.id);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-color)",
            color: "var(--text-primary)",
            flex: 1,
            opacity: isUploading ? 0.6 : 1,
          }}
        />
        {isUploading && (
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            ⏳ Uploading...
          </span>
        )}
        {!isUploading && value && (
          <span style={{ fontSize: "0.875rem", color: "var(--success)", whiteSpace: "nowrap" }}>
            ✅ Uploaded
          </span>
        )}
      </div>
      {value && !isUploading && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          File ID: {value}
        </div>
      )}
    </div>
  );
}
