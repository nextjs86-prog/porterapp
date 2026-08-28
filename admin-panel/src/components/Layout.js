import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAdminStore from '../store/useAdminStore';

const MOBILE_QUERY = '(max-width: 768px)';

const NAV = [
  { to: '/',             icon: '📊', label: 'Dashboard'     },
  { to: '/orders',       icon: '📦', label: 'Orders'        },
  { to: '/drivers',      icon: '🚛', label: 'Drivers'       },
  { to: '/customers',    icon: '👥', label: 'Customers'     },
  { to: '/pricing',      icon: '💰', label: 'Pricing'       },
  { to: '/promos',       icon: '🎁', label: 'Promo Codes'   },
  { to: '/analytics',    icon: '📈', label: 'Analytics'     },
  { to: '/notifications',icon: '🔔', label: 'Notifications' },
  { to: '/settings',     icon: '⚙️',  label: 'Settings'     },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const logout    = useAdminStore(s => s.logout);
  const navigate  = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setCollapsed(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 240 }}>
        <div style={styles.sidebarHeader}>
          {!collapsed && (
            <span style={styles.logo}>
              <img src="/logo.png" alt="Sahara Logistics" style={styles.logoImg} />
              Sahara
            </span>
          )}
          <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav style={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navActive : {}) })}
            >
              <span style={styles.navIcon}>{icon}</span>
              {!collapsed && <span style={styles.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>Admin Panel</h2>
          <div style={styles.adminBadge}>👤 Admin</div>
        </div>
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  shell:          { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar:        { backgroundColor: '#1E3A8A', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0 },
  sidebarHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logo:           { display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 700, fontSize: 18 },
  logoImg:        { width: 32, height: 32, borderRadius: '50%', flexShrink: 0 },
  collapseBtn:    { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: 6, padding: '4px 8px' },
  nav:            { flex: 1, padding: '12px 0', overflowY: 'auto' },
  navItem:        { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, transition: 'all 0.15s' },
  navActive:      { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRight: '3px solid #E15A04' },
  navIcon:        { fontSize: 18, flexShrink: 0 },
  navLabel:       {},
  logoutBtn:      { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, borderTop: '1px solid rgba(255,255,255,0.1)' },
  main:           { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F8FAFC' },
  topBar:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  pageTitle:      { fontSize: 20, fontWeight: 700, color: '#0F172A' },
  adminBadge:     { fontSize: 14, color: '#64748B', backgroundColor: '#F1F5F9', padding: '6px 14px', borderRadius: 20 },
  content:        { flex: 1, overflow: 'auto', padding: 24 },
};
