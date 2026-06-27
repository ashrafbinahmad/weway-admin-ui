import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Service, type PaginatedResponse } from "../lib/api";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { DataTable, type Column } from "../components/DataTable";
import { FormPopup } from "../components/FormPopup";
import { FilePicker } from "../components/FilePicker";

export function Services() {
  const { categoryId } = useParams();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ['services', categoryId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Service>>(`/services?categoryId=${categoryId}`);
      return response.data.data;
    },
    enabled: !!categoryId,
  });

  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: any }>(`/categories/${categoryId}`);
      return response.data.data;
    },
    enabled: !!categoryId,
  });


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: categoryId || "",
    name: "",
    slug: "",
    minVolume: 0,
    maxVolume: "",
    price: "",
    imageFileId: "",
    isPriceCustomizeable: false,
  });

  const createServiceMutation = useMutation({
    mutationFn: (payload: any) => api.post("/services", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', categoryId] });
      handleCloseModal();
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => api.put(`/services/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', categoryId] });
      handleCloseModal();
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', categoryId] });
    }
  });

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id);
      setFormData({
        categoryId: categoryId || "",
        name: service.name,
        slug: service.slug,
        minVolume: service.minVolume || 0,
        maxVolume: service.maxVolume !== null ? String(service.maxVolume) : "",
        price: service.price || "",
        imageFileId: (service as any).imageFileId || "",
        isPriceCustomizeable: (service as any).isPriceCustomizeable ?? false,
      });
    } else {
      setEditingId(null);
      setFormData({
        categoryId: categoryId || "",
        name: "",
        slug: "",
        minVolume: 0,
        maxVolume: "",
        price: "",
        imageFileId: "",
        isPriceCustomizeable: false,
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
    try {
      const payload: any = { 
        ...formData,
        minVolume: Number(formData.minVolume),
      };
      
      if (formData.maxVolume) {
        payload.maxVolume = Number(formData.maxVolume);
      } else {
        payload.maxVolume = null;
      }

      if (!payload.imageFileId) payload.imageFileId = null;

      if (editingId) {
        await updateServiceMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createServiceMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error("Failed to save service:", error);
      alert("Failed to save. Please check the form data.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteServiceMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Failed to delete service.");
      }
    }
  };

  const baseColumns: Column<Service>[] = [
    {
      id: "image",
      label: "Image",
      render: (svc) =>
        (svc as any).imageFile?.fileUrl ? (
          <img
            src={(svc as any).imageFile.fileUrl}
            alt={svc.name}
            style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "40px", height: "40px", background: "var(--accent)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "white" }}>
            N/A
          </div>
        ),
    },
    {
      id: "name",
      label: "Name",
      render: (svc) => <span style={{ fontWeight: 500 }}>{svc.name}</span>,
    },
    {
      id: "slug",
      label: "Slug",
      render: (svc) => <span style={{ color: "var(--text-secondary)" }}>{svc.slug}</span>,
    },
    {
      id: "price",
      label: "Price",
      render: (svc) => <span>₹{svc.price}</span>,
    },
    {
      id: "isPriceCustomizeable",
      label: "Custom Pricing",
      render: (svc) => (
        <span className={`badge ${(svc as any).isPriceCustomizeable ? "badge-success" : "badge-secondary"}`}>
          {(svc as any).isPriceCustomizeable ? "Yes" : "No"}
        </span>
      ),
    },
    {
      id: "volume",
      label: "Volume",
      render: (svc) => (
        <span>
          {svc.minVolume} {svc.maxVolume ? `- ${svc.maxVolume}` : "+"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      render: (svc) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleOpenModal(svc)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(svc.id)}
            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const extraColumns: Column<Service>[] = [
    { id: "id", label: "ID", render: (svc) => svc.id },
    { id: "categoryId", label: "Category ID", render: (svc) => svc.categoryId },
    { id: "imageFileId", label: "Image File ID", render: (svc) => (svc as any).imageFileId || "-" },
    { id: "createdAt", label: "Created At", render: (svc) => (svc as any).createdAt ? new Date((svc as any).createdAt).toLocaleDateString() : "-" },
    { id: "updatedAt", label: "Updated At", render: (svc) => (svc as any).updatedAt ? new Date((svc as any).updatedAt).toLocaleDateString() : "-" },
  ];

  const columns = showAllColumns
    ? [...baseColumns.slice(0, -1), ...extraColumns, baseColumns[baseColumns.length - 1]]
    : baseColumns;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "16px" }}>
        <Link to="/categories" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", width: "fit-content" }}>
          <ArrowLeft size={16} /> Back to Categories
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {categoryData ? `${categoryData.name} Services` : "Services"}
        </h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <FormControlLabel
            control={<Switch checked={showAllColumns} onChange={(e) => setShowAllColumns(e.target.checked)} />}
            label="Show All Columns"
          />
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={services} loading={loading} emptyMessage="No services found." />
      </div>

      <FormPopup
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Edit Service" : "Add Service"}
        onSubmit={handleSubmit}
        submitLabel={editingId ? "Save Changes" : "Create"}
      >
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
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Slug<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
            <input
              required
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Min Volume<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
            <input
              required
              type="number"
              min="0"
              value={formData.minVolume}
              onChange={(e) => setFormData({ ...formData, minVolume: Number(e.target.value) })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Max Volume</label>
            <input
              type="number"
              min="0"
              value={formData.maxVolume}
              onChange={(e) => setFormData({ ...formData, maxVolume: e.target.value })}
              placeholder="Optional"
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Price<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
          <input
            required
            type="text"
            placeholder="e.g. 499.00"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <input
            type="checkbox"
            id="isPriceCustomizeable"
            checked={formData.isPriceCustomizeable}
            onChange={(e) => setFormData({ ...formData, isPriceCustomizeable: e.target.checked })}
          />
          <label htmlFor="isPriceCustomizeable" style={{ fontSize: "0.875rem" }}>
            Is Price Customizeable by Vendor?
          </label>
        </div>

        <FilePicker
          label="Image File (S3 Upload)"
          value={formData.imageFileId}
          onChange={(val) => setFormData({ ...formData, imageFileId: val })}
        />
      </FormPopup>
    </div>
  );
}
