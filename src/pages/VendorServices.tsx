import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Vendor, type Category, type Service, type PaginatedResponse } from "../lib/api";
import { DataTable, type Column } from "../components/DataTable";
import { FormPopup } from "../components/FormPopup";

export function VendorServices() {
  const { vendorId } = useParams();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading: loading } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const response = await api.get<{ data: Vendor }>(`/vendors/${vendorId}`);
      return response.data.data;
    },
    enabled: !!vendorId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Category>>("/categories");
      return response.data.data;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "",
    serviceId: "",
    customPrice: "",
  });

  const { data: categoryServices = [] } = useQuery({
    queryKey: ['services', formData.categoryId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Service>>(`/services?categoryId=${formData.categoryId}`);
      return response.data.data;
    },
    enabled: !!formData.categoryId,
  });

  const addServiceMutation = useMutation({
    mutationFn: (payload: any) => api.post("/vendors/category-pricing", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      setIsModalOpen(false);
      setFormData({ categoryId: "", serviceId: "", customPrice: "" });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vendors/category-pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addServiceMutation.mutateAsync({
        vendorId,
        categoryId: formData.categoryId,
        serviceId: formData.serviceId,
        customPrice: formData.customPrice,
      });
    } catch (error: any) {
      console.error("Failed to add service:", error);
      const msg = error.response?.data?.message || "Failed to add service. Please check the form data.";
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this service from the vendor?")) {
      try {
        await deleteServiceMutation.mutateAsync(id);
      } catch (error: any) {
        console.error("Failed to delete:", error);
        const msg = error.response?.data?.message || "Failed to delete vendor service.";
        alert(msg);
      }
    }
  };

  const services = (vendor as any)?.vendorServicePricing || [];

  const columns: Column<any>[] = [
    {
      id: "category",
      label: "Category",
      render: (item) => <span style={{ fontWeight: 500 }}>{item.category?.name || "N/A"}</span>,
    },
    {
      id: "service",
      label: "Service",
      render: (item) => <span>{item.service?.name || "N/A"}</span>,
    },
    {
      id: "price",
      label: "Custom Price",
      render: (item) => <span>₹{item.customPrice}</span>,
    },
    {
      id: "actions",
      label: "Actions",
      render: (item) => (
        <button
          onClick={() => handleDelete(item.id)}
          style={{
            background: "none",
            border: "none",
            color: "var(--danger)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          title="Remove Service"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "16px" }}>
        <Link to="/vendors" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", width: "fit-content" }}>
          <ArrowLeft size={16} /> Back to Vendors
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Services for {vendor?.name || "Vendor"}
        </h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="data-table-container">
        <DataTable columns={columns} data={services} loading={loading} emptyMessage="No services found for this vendor." />
      </div>

      <FormPopup
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Service to Vendor"
        onSubmit={handleSubmit}
        submitLabel="Add Service"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Category<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, serviceId: "" })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
            >
              <option value="">Select Category...</option>
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Service<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
            <select
              required
              value={formData.serviceId}
              onChange={(e) => {
                const serviceId = e.target.value;
                const selectedSvc = categoryServices.find((s: any) => s.id === serviceId);
                setFormData({
                  ...formData,
                  serviceId,
                  customPrice: selectedSvc && !(selectedSvc as any).isPriceCustomizeable ? selectedSvc.price : formData.customPrice,
                });
              }}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              disabled={!formData.categoryId}
            >
              <option value="">Select Service...</option>
              {categoryServices.map((svc: Service) => (
                <option key={svc.id} value={svc.id}>{svc.name} (Base Price: ₹{svc.price})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Custom Price<span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span></label>
            <input
              required
              type="text"
              placeholder="e.g. 499.00"
              value={formData.customPrice}
              onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-color)", color: "var(--text-primary)" }}
              disabled={(() => {
                const selectedSvc = categoryServices.find((s: any) => s.id === formData.serviceId);
                return selectedSvc ? !(selectedSvc as any).isPriceCustomizeable : false;
              })()}
            />
          </div>
        </div>
      </FormPopup>
    </div>
  );
}
