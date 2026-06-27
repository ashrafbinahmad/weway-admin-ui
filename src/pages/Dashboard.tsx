import { Users, Grid, CalendarCheck, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type Column } from "../components/DataTable";
import { api, type PaginatedResponse, type Booking, type Vendor, type Category } from "../lib/api";

type RecentBooking = {
  id: string;
  customer: string;
  service: string;
  status: string;
  amount: string;
};

const columns: Column<RecentBooking>[] = [
  { id: "id", label: "ID", render: (bkg) => bkg.id },
  { id: "customer", label: "Customer", render: (bkg) => bkg.customer },
  { id: "service", label: "Service", render: (bkg) => bkg.service },
  {
    id: "status",
    label: "Status",
    render: (bkg) => {
      let badgeClass = "badge-warning";
      if (bkg.status === "COMPLETED") badgeClass = "badge-success";
      if (bkg.status === "CANCELLED" || bkg.status === "REJECTED") badgeClass = "badge-danger";
      if (bkg.status === "ACCEPTED" || bkg.status === "ASSIGNED") badgeClass = "badge-success";
      
      return (
        <span className={`badge ${badgeClass}`}>
          {bkg.status}
        </span>
      );
    }
  },
  { id: "amount", label: "Amount", render: (bkg) => bkg.amount }
];

export function Dashboard() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [vendorsRes, categoriesRes, bookingsRes] = await Promise.all([
        api.get<PaginatedResponse<Vendor>>("/vendors?limit=1"),
        api.get<PaginatedResponse<Category>>("/categories?limit=1"),
        api.get<{ success: boolean; data: Booking[] }>("/bookings")
      ]);

      const totalVendors = vendorsRes.data.pagination?.total || vendorsRes.data.data?.length || 0;
      const totalCategories = categoriesRes.data.pagination?.total || categoriesRes.data.data?.length || 0;
      
      const allBookings = bookingsRes.data.data || [];
      
      const activeBookingsCount = allBookings.filter(b => 
        ['PENDING_ASSIGNMENT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)
      ).length;

      // Revenue: sum of totalAmount from COMPLETED bookings (fallback to all if needed, but let's stick to COMPLETED)
      const revenue = allBookings
        .filter(b => b.status === 'COMPLETED' || b.status === 'ACCEPTED') 
        .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);

      const recentBookingsList: RecentBooking[] = allBookings.slice(0, 5).map(b => ({
        id: `#BKG-${b.id.substring(0, 5).toUpperCase()}`,
        customer: b.user?.name || 'Guest',
        service: b.service?.name || 'Service',
        status: b.status,
        amount: `₹${b.totalAmount}`
      }));

      return {
        totalVendors,
        totalCategories,
        activeBookingsCount,
        revenue,
        recentBookingsList
      };
    }
  });

  if (loading) {
    return (
      <div className="loading-state">
        <Activity className="spinner" size={40} />
        <p>Loading overview data...</p>
      </div>
    );
  }

  const stats = data || {
    totalVendors: 0,
    totalCategories: 0,
    activeBookingsCount: 0,
    revenue: 0,
    recentBookingsList: []
  };

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Vendors</h3>
            <p>{stats.totalVendors}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Grid size={24} />
          </div>
          <div className="stat-info">
            <h3>Categories</h3>
            <p>{stats.totalCategories}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <CalendarCheck size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Bookings</h3>
            <p>{stats.activeBookingsCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Revenue (M-T-D)</h3>
            <p>₹{stats.revenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <div className="table-header">
          <h2>Recent Bookings</h2>
          <button className="btn btn-primary">View All</button>
        </div>
        <DataTable
          columns={columns}
          data={stats.recentBookingsList}
          loading={loading}
          emptyMessage="No recent bookings."
        />
      </div>
    </div>
  );
}
