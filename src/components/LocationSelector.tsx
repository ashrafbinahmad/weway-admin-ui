import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface LocationItem {
  id: string;
  name: string;
}

interface LocationResponse {
  success: boolean;
  data: LocationItem[];
}

interface LocationSelectorProps {
  type: "countries" | "states" | "districts" | "cities";
  parentId?: string; // Required for states, districts, cities
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
  required?: boolean;
}

export function LocationSelector({
  type,
  parentId,
  value,
  onChange,
  disabled,
  label,
  required,
}: LocationSelectorProps) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["locations", type, parentId],
    queryFn: async () => {
      let endpoint = "";
      if (type === "countries") endpoint = "/countries";
      else if (type === "states") endpoint = `/countries/${parentId}/states`;
      else if (type === "districts") endpoint = `/states/${parentId}/districts`;
      else if (type === "cities") endpoint = `/districts/${parentId}/cities`;

      // Pagination override to get all
      const response = await api.get<LocationResponse>(`${endpoint}?limit=1000`);
      return response.data.data;
    },
    enabled: type === "countries" ? true : !!parentId,
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading || (type !== "countries" && !parentId)}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--bg-color)",
          color: "var(--text-primary)",
          opacity: disabled || isLoading ? 0.6 : 1,
        }}
      >
        <option value="">Select {label}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
