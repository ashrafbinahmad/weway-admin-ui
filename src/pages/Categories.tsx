import { Plus, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Category, type PaginatedResponse } from "../lib/api";
import * as MuiIcons from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { DataTable, type Column } from "../components/DataTable";
import { FormPopup } from "../components/FormPopup";
import { FilePicker } from "../components/FilePicker";
export function Categories() {
  const queryClient = useQueryClient();
  
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Category>>("/categories");
      return response.data.data;
    }
  });

  const iconNames = useMemo(() => {
    // Filter out icon variants to just show the base filled icons
    return Object.keys(MuiIcons).filter(
      (name) => !/Outlined|Rounded|TwoTone|Sharp/.test(name),
    );
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "",
    subtitle: "",
    description: "",
    icon: "",
    imageFileId: "",
    isFeatured: false,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: any) => api.post("/categories", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => api.put(`/categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        slug: category.slug,
        type: category.type,
        subtitle: (category as any).subtitle || "",
        description: category.description || "",
        icon: category.icon || "",
        imageFileId: (category as any).imageFileId || "",
        isFeatured: category.isFeatured,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        slug: "",
        type: "",
        subtitle: "",
        description: "",
        icon: "",
        imageFileId: "",
        isFeatured: false,
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
      const payload: any = { ...formData };
      if (!payload.imageFileId) payload.imageFileId = null;
      if (!payload.icon) payload.icon = null;
      if (!payload.description) payload.description = null;
      if (!payload.subtitle) payload.subtitle = null;

      if (editingId) {
        await updateCategoryMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createCategoryMutation.mutateAsync(payload);
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save. Please check the form data.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete:", error);
        alert("Failed to delete category.");
      }
    }
  };

  const baseColumns: Column<Category>[] = [
    {
      id: "image",
      label: "Image",
      render: (cat) =>
        (cat as any).imageFile?.fileUrl ? (
          <img
            src={(cat as any).imageFile.fileUrl}
            alt={cat.name}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "40px",
              height: "40px",
              background: "var(--accent)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ❌
          </div>
        ),
    },
    {
      id: "icon",
      label: "Icon",
      render: (cat) => (
        <div
          style={{
            width: "40px",
            height: "40px",
            background: "var(--bg-hover)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cat.icon && (MuiIcons as any)[cat.icon]
            ? (() => {
                const IconComponent = (MuiIcons as any)[cat.icon];
                return <IconComponent />;
              })()
            : "❌"}
        </div>
      ),
    },
    {
      id: "name",
      label: "Name",
      render: (cat) => (
        <Link 
          to={`/categories/${cat.id}/services`} 
          style={{ fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}
        >
          {cat.name}
        </Link>
      ),
    },
    {
      id: "servicesCount",
      label: "Services",
      render: (cat) => (
        <span style={{ fontWeight: 500 }}>
          {((cat as any).services?.length) || 0} services
        </span>
      ),
    },
    { id: "type", label: "Type" },
    {
      id: "slug",
      label: "Slug",
      render: (cat) => (
        <span style={{ color: "var(--text-secondary)" }}>{cat.slug}</span>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (cat) => (
        <span
          className={`badge ${cat.isFeatured ? "badge-success" : "badge-warning"}`}
        >
          {cat.isFeatured ? "Featured" : "Standard"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      render: (cat) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleOpenModal(cat)}
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
            onClick={() => handleDelete(cat.id)}
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

  const extraColumns: Column<Category>[] = [
    { id: "id", label: "ID", render: (cat) => cat.id },
    { id: "subtitle", label: "Subtitle", render: (cat) => (cat as any).subtitle || "-" },
    { id: "description", label: "Description", render: (cat) => (cat as any).description ? (cat as any).description.substring(0, 50) + "..." : "-" },
    { id: "imageFileId", label: "Image File ID", render: (cat) => (cat as any).imageFileId || "-" },
    { id: "isFeatured", label: "Featured", render: (cat) => cat.isFeatured ? "Yes" : "No" },
    { id: "createdAt", label: "Created At", render: (cat) => (cat as any).createdAt ? new Date((cat as any).createdAt).toLocaleDateString() : "-" },
    { id: "updatedAt", label: "Updated At", render: (cat) => (cat as any).updatedAt ? new Date((cat as any).updatedAt).toLocaleDateString() : "-" },
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
          Categories & Services
        </h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <FormControlLabel
            control={<Switch checked={showAllColumns} onChange={(e) => setShowAllColumns(e.target.checked)} />}
            label="Show All Columns"
          />
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage="No categories found."
        />
      </div>

      <FormPopup
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Edit Category" : "Add Category"}
        onSubmit={handleSubmit}
        submitLabel={editingId ? "Save Changes" : "Create"}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              Name<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              Slug<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>
            </label>
            <input
              required
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Type (e.g., Cleaning, Repair)<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>
          </label>
          <input
            required
            type="text"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-color)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Subtitle
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, subtitle: e.target.value })
            }
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-color)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-color)",
              color: "var(--text-primary)",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Icon (Material Design)
          </label>
          <Autocomplete
            disablePortal
            value={formData.icon || null}
            onChange={(_, newValue) => {
              setFormData({ ...formData, icon: newValue || "" });
            }}
            options={iconNames}
            getOptionLabel={(option) => option}
            renderOption={(props, option) => {
              const IconComponent = (MuiIcons as any)[option];
              return (
                <li {...props} key={option} style={{ ...props.style, display: "flex", alignItems: "center", gap: "8px" }}>
                  {IconComponent && <IconComponent fontSize="small" />}
                  <span>{option}</span>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search icon..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      {formData.icon && (MuiIcons as any)[formData.icon] ? (() => {
                        const SelectedIcon = (MuiIcons as any)[formData.icon];
                        return (
                          <div style={{ display: "flex", alignItems: "center", paddingLeft: "8px" }}>
                            <SelectedIcon fontSize="small" />
                          </div>
                        );
                      })() : null}
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  background: "var(--bg-color)",
                  "& .MuiOutlinedInput-root": {
                    color: "var(--text-primary)",
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: "var(--border)",
                    },
                  },
                }}
              />
            )}
            ListboxProps={{
              style: { maxHeight: 300 },
            }}
            style={{ zIndex: 10000 }}
          />
        </div>

        <FilePicker
          label="Image File (S3 Upload)"
          value={formData.imageFileId}
          onChange={(val) => setFormData({ ...formData, imageFileId: val })}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={(e) =>
              setFormData({ ...formData, isFeatured: e.target.checked })
            }
          />
          <label htmlFor="isFeatured" style={{ fontSize: "0.875rem" }}>
            Featured Category
          </label>
        </div>
      </FormPopup>
    </div>
  );
}
