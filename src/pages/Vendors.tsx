import { Plus, Search, Filter, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Vendor, type PaginatedResponse } from "../lib/api";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { FormPopup } from "../components/FormPopup";
import { DataTable, type Column } from "../components/DataTable";
import { LocationSelector } from "../components/LocationSelector";
import { FilePicker } from "../components/FilePicker";

export function Vendors() {
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading: loading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Vendor>>("/vendors");
      return response.data.data;
    },
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    slug: "",
    imageFileId: "",
    coverImageUrl: "",
    email: "",
    phone: "",
    address: "",
    countryId: "",
    stateId: "",
    districtId: "",
    cityId: "",
    pincode: "",
    lat: "",
    lng: "",
    isAvailable: true,
    status: "KYC_NOT_VERIFIED",
  });

  const createVendorMutation = useMutation({
    mutationFn: (payload: any) => api.post("/vendors", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      handleCloseModal();
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.put(`/vendors/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      handleCloseModal();
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  const handleOpenModal = (vendor?: Vendor) => {
    setFormErrors([]);
    if (vendor) {
      setEditingId(vendor.id);
      setFormData({
        name: vendor.name,
        legalName: (vendor as any).legalName || "",
        slug: (vendor as any).slug || "",
        imageFileId: (vendor as any).imageFileId || "",
        coverImageUrl: (vendor as any).coverImageUrl || "",
        email: (vendor as any).email || "",
        phone: vendor.phone || (vendor as any).phone || "",
        address: (vendor as any).address || "",
        countryId: (vendor as any).countryId || "",
        stateId: (vendor as any).stateId || "",
        districtId: (vendor as any).districtId || "",
        cityId: (vendor as any).cityId || "",
        pincode: (vendor as any).pincode || "",
        lat: (vendor as any).location?.lat?.toString() || "",
        lng: (vendor as any).location?.lng?.toString() || "",
        isAvailable: (vendor as any).isAvailable ?? true,
        status: vendor.status || (vendor as any).status || "KYC_NOT_VERIFIED",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        legalName: "",
        slug: "",
        imageFileId: "",
        coverImageUrl: "",
        email: "",
        phone: "",
        address: "",
        countryId: "",
        stateId: "",
        districtId: "",
        cityId: "",
        pincode: "",
        lat: "",
        lng: "",
        isAvailable: true,
        status: "KYC_NOT_VERIFIED",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    try {
      const payload = {
        ...formData,
        location: {
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0,
        },
      };

      // Clean up top-level lat/lng if necessary
      delete (payload as any).lat;
      delete (payload as any).lng;

      // Scrub empty strings from payload so Zod optional fields don't fail validation
      Object.keys(payload).forEach((key) => {
        if ((payload as any)[key] === "") {
          delete (payload as any)[key];
        }
      });

      if (editingId) {
        await updateVendorMutation.mutateAsync({
          id: editingId,
          payload,
        });
      } else {
        await createVendorMutation.mutateAsync(payload);
      }
    } catch (error: any) {
      console.error("Failed to save vendor:", error);
      if (error.response?.data?.details) {
        setFormErrors(error.response.data.details);
      } else if (error.response?.data?.message) {
        setFormErrors([{ message: error.response.data.message }]);
      } else {
        alert("Failed to save vendor.");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await deleteVendorMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Failed to delete vendor.");
      }
    }
  };

  const baseColumns: Column<Vendor>[] = [
    {
      id: "vendorDetails",
      label: "Vendor Details",
      render: (vendor) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {(vendor as any).imageFileId ? (
            // {vendor.profileImageUrl || (vendor as any).imageFileId ? (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              🖼️
            </div>
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {vendor.name.charAt(0)}
            </div>
          )}
          <Link to={`/vendors/${vendor.id}/services`} style={{ fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>{vendor.name}</Link>
        </div>
      ),
    },
    {
      id: "phone",
      label: "Phone",
      render: (vendor) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {vendor.phone || (vendor as any).phone}
        </span>
      ),
    },
    {
      id: "legalName",
      label: "Legal Name",
      render: (vendor) => <span>{(vendor as any).legalName || "N/A"}</span>,
    },
    {
      id: "status",
      label: "Status",
      render: (vendor) => (
        <span
          className={`badge ${
            ((vendor as any).status || vendor.status) === "APPROVED"
              ? "badge-success"
              : ((vendor as any).status || vendor.status) === "REJECTED"
                ? "badge-danger"
                : "badge-warning"
          }`}
        >
          {(vendor as any).status || vendor.status}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      render: (vendor) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleOpenModal(vendor)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(vendor.id)}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const extraColumns: Column<Vendor>[] = [
    { id: "id", label: "ID", render: (v) => v.id },
    { id: "email", label: "Email", render: (v) => (v as any).email || "-" },
    { id: "address", label: "Address", render: (v) => (v as any).address || "-" },
    { id: "countryId", label: "Country ID", render: (v) => (v as any).countryId || "-" },
    { id: "stateId", label: "State ID", render: (v) => (v as any).stateId || "-" },
    { id: "districtId", label: "District ID", render: (v) => (v as any).districtId || "-" },
    { id: "cityId", label: "City ID", render: (v) => (v as any).cityId || "-" },
    { id: "pincode", label: "Pincode", render: (v) => (v as any).pincode || "-" },
    { id: "lat", label: "Lat", render: (v) => (v as any).location?.lat || "-" },
    { id: "lng", label: "Lng", render: (v) => (v as any).location?.lng || "-" },
    { id: "slug", label: "Slug", render: (v) => (v as any).slug || "-" },
    { id: "isAvailable", label: "Available", render: (v) => ((v as any).isAvailable ? "Yes" : "No") },
    { id: "imageFileId", label: "Image File ID", render: (v) => (v as any).imageFileId || "-" },
    { id: "coverImageUrl", label: "Cover Image URL", render: (v) => (v as any).coverImageUrl || "-" },
    { id: "createdAt", label: "Created At", render: (v) => (v as any).createdAt ? new Date((v as any).createdAt).toLocaleDateString() : "-" },
    { id: "updatedAt", label: "Updated At", render: (v) => (v as any).updatedAt ? new Date((v as any).updatedAt).toLocaleDateString() : "-" },
  ];

  const columns = showAllColumns
    ? [...baseColumns.slice(0, -1), ...extraColumns, baseColumns[baseColumns.length - 1]]
    : baseColumns;

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Vendor Management
        </h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <FormControlLabel
            control={<Switch checked={showAllColumns} onChange={(e) => setShowAllColumns(e.target.checked)} />}
            label="Show All Columns"
          />
          <button
            className="btn"
            style={{
              backgroundColor: "var(--bg-panel)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-color)",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              width: "300px",
            }}
          >
            <Search
              size={16}
              style={{ color: "var(--text-secondary)", marginRight: "8px" }}
            />
            <input
              type="text"
              placeholder="Search vendors..."
              style={{
                background: "none",
                border: "none",
                color: "var(--text-primary)",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={vendors}
          loading={loading}
          emptyMessage="No vendors found."
        />
      </div>

      <FormPopup
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Edit Vendor" : "Add Vendor"}
        onSubmit={handleSubmit}
        submitLabel={editingId ? "Save Changes" : "Create"}
        errorDetails={formErrors}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Name<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Legal Name<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Slug<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Email<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Phone<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Status<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              >
                <option value="KYC_NOT_VERIFIED">KYC Not Verified</option>
                <option value="KYC_VERIFIED">KYC Verified</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <FilePicker
            label="Image File (S3 Upload)"
            value={formData.imageFileId}
            onChange={(val) => setFormData({ ...formData, imageFileId: val })}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Cover Image URL</label>
            <input
              type="text"
              value={formData.coverImageUrl}
              onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
            />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Address<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Pincode<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <LocationSelector
              required
              type="countries"
              label="Country"
              value={formData.countryId}
              onChange={(val) => setFormData({ ...formData, countryId: val, stateId: "", districtId: "", cityId: "" })}
            />
            <LocationSelector
              required
              type="states"
              label="State"
              parentId={formData.countryId}
              value={formData.stateId}
              onChange={(val) => setFormData({ ...formData, stateId: val, districtId: "", cityId: "" })}
            />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <LocationSelector
              required
              type="districts"
              label="District"
              parentId={formData.stateId}
              value={formData.districtId}
              onChange={(val) => setFormData({ ...formData, districtId: val, cityId: "" })}
            />
            <LocationSelector
              type="cities"
              label="City"
              parentId={formData.districtId}
              value={formData.cityId}
              onChange={(val) => setFormData({ ...formData, cityId: val })}
            />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Latitude<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Longitude<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
              <input
                required
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                style={{ width: "20px", height: "20px" }}
              />
              <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Is Available</label>
            </div>
          </div>
        </div>
      </FormPopup>
    </div>
  );
}
