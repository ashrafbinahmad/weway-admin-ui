import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Grid, Settings, MapPin, Receipt, CalendarCheck, HelpCircle, Activity } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { Services } from './pages/Services';
import { Vendors } from './pages/Vendors';
import { VendorServices } from './pages/VendorServices';
import { Bookings } from './pages/Bookings';

function Sidebar() {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories & Services', icon: Grid },
    { path: '/vendors', label: 'Vendor & Services', icon: Users },
    { path: '/bookings', label: 'Bookings', icon: CalendarCheck },
    { path: '/payments', label: 'Payments', icon: Receipt },
    { path: '/locations', label: 'Locations', icon: MapPin },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Activity size={28} />
        <span>WeWay Admin</span>
      </div>
      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="top-bar">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Overview</h2>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <HelpCircle size={24} />
        </button>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          A
        </div>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <TopBar />
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:categoryId/services" element={<Services />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/vendors/:vendorId/services" element={<VendorServices />} />
              <Route path="/bookings" element={<Bookings />} />
              {/* Fallback for un-implemented pages */}
              <Route path="*" element={
                <div className="fade-in" style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
                  <LayoutDashboard size={64} style={{ opacity: 0.2, marginBottom: '24px' }} />
                  <h2>Page Under Construction</h2>
                  <p>This module is currently being built.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
