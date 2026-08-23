import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import API from '../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...s.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ ...s.statIcon, backgroundColor: color + '20' }}>{icon}</div>
    <div>
      <div style={s.statVal}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats,    setStats]    = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    API.get('/admin/dashboard-stats').then(r => setStats(r.data)).catch(() => {});
    API.get('/admin/analytics').then(r => setAnalytics(r.data)).catch(() => {});
  }, []);

  const chartData = analytics?.revenueByDay?.map(d => ({
    date:    d._id?.slice(5),
    revenue: d.revenue,
    orders:  d.count,
  })) || [];

  return (
    <div style={s.page}>
      <h1 style={s.pageTitle}>Dashboard Overview</h1>

      {/* Stat Cards */}
      <div style={s.statsGrid}>
        <StatCard icon="📦" label="Total Orders"    value={stats?.totalOrders    ?? '—'} color="#3B82F6" />
        <StatCard icon="🗓️" label="Today's Orders"  value={stats?.todayOrders    ?? '—'} color="#8B5CF6" />
        <StatCard icon="🚛" label="Active Drivers"  value={stats?.activeDrivers  ?? '—'} color="#22C55E" />
        <StatCard icon="👥" label="Total Customers" value={stats?.totalCustomers ?? '—'} color="#F59E0B" />
        <StatCard icon="💰" label="Revenue Today"   value={stats ? `₹${stats.revenueToday}` : '—'} color="#EF4444" />
      </div>

      {/* Charts */}
      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Revenue Trend (Last 30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>Orders Per Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Drivers */}
      {analytics?.topDrivers?.length > 0 && (
        <div style={s.tableCard}>
          <h3 style={s.chartTitle}>Top Drivers</h3>
          <table style={s.table}>
            <thead>
              <tr>
                {['Driver', 'Trips', 'Earnings'].map(h => <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {analytics.topDrivers.map((d, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>{d.driver?.name || 'N/A'}</td>
                  <td style={s.td}>{d.trips}</td>
                  <td style={s.td}>₹{d.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { display: 'flex', flexDirection: 'column', gap: 24 },
  pageTitle:  { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  statCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  statIcon:   { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  statVal:    { fontSize: 26, fontWeight: 700, color: '#0F172A' },
  statLabel:  { fontSize: 12, color: '#64748B', marginTop: 2 },
  chartsRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 },
  chartCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  tableCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  tr:         { borderBottom: '1px solid #F1F5F9' },
  td:         { padding: '12px 12px', fontSize: 14, color: '#334155' },
};
