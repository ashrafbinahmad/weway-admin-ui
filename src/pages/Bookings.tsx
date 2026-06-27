import { Search, Filter, Download, Activity, Edit2, Trash2, X, Plus } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Booking, type PaginatedResponse } from '../lib/api';
import { FormPopup } from '../components/FormPopup';
import { DataTable, type Column } from '../components/DataTable';

export function Bookings() {
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading: loading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Booking>>('/bookings');
      return response.data.data;
    }
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: 'PENDING_ASSIGNMENT',
    totalAmount: '',
    scheduledAt: ''
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => api.put(`/bookings/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      handleCloseModal();
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingId(booking.id);
      setFormData({
        status: booking.status,
        totalAmount: booking.totalAmount,
        scheduledAt: new Date(booking.scheduledAt).toISOString().slice(0, 16)
      });
      setIsModalOpen(true);
    } else {
      // For Bookings, creation is complex due to relationships. We only allow editing here for simplicity.
      alert('Creating a booking manually requires selecting a User, Category, Service, and Vendor. Please use the app flow to create a booking.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: editingId,
        payload: {
          status: formData.status,
          totalAmount: formData.totalAmount,
          scheduledAt: new Date(formData.scheduledAt).toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Failed to update. Ensure you have the right permissions.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBookingMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete booking.');
      }
    }
  };

  const columns: Column<Booking>[] = [
    {
      id: "bookingId",
      label: "Booking ID",
      render: (bkg) => <span style={{ fontWeight: 600, color: "var(--accent)" }}>#{bkg.id.substring(0, 8)}</span>
    },
    {
      id: "customer",
      label: "Customer",
      render: (bkg) => <span>{bkg.user?.name || "Unknown"}</span>
    },
    {
      id: "service",
      label: "Service",
      render: (bkg) => <span>{bkg.service?.name || "Unknown"}</span>
    },
    {
      id: "vendor",
      label: "Assigned Vendor",
      render: (bkg) => <span>{bkg.vendor ? bkg.vendor.name : <span style={{ color: "var(--text-secondary)" }}>Not assigned</span>}</span>
    },
    {
      id: "totalAmount",
      label: "Total Amount",
      render: (bkg) => <span style={{ fontWeight: 500 }}>₹{bkg.totalAmount}</span>
    },
    {
      id: "scheduledAt",
      label: "Scheduled At",
      render: (bkg) => <span style={{ fontSize: "0.875rem" }}>{new Date(bkg.scheduledAt).toLocaleString()}</span>
    },
    {
      id: "status",
      label: "Status",
      render: (bkg) => (
        <span
          className={`badge ${
            bkg.status === "COMPLETED"
              ? "badge-success"
              : bkg.status === "CANCELLED" || bkg.status === "REJECTED"
                ? "badge-danger"
                : "badge-warning"
          }`}
        >
          {bkg.status}
        </span>
      )
    },
    {
      id: "actions",
      label: "Actions",
      render: (bkg) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleOpenModal(bkg)}
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
            onClick={() => handleDelete(bkg.id)}
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
      )
    }
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Booking Management</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={16} /> Create</button>
        </div>
      </div>

      <div className="data-table-container">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', width: '300px' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search bookings by ID..." 
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} 
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          loading={loading}
          emptyMessage="No bookings found."
        />
      </div>

      <FormPopup
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Update Booking"
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                  <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                <input required type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Scheduled At</label>
                <input required type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({...formData, scheduledAt: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-primary)', colorScheme: 'dark' }} />
              </div>
      </FormPopup>
    </div>
  );
}
