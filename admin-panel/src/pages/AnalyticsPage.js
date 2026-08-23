import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import API from '../services/api';
import dayjs from 'dayjs';

export default function AnalyticsPage() {
  const [data,  setData]  = useState(null);
  const [start, setStart] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [end,   setEnd]   = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => { load(); }, [start, end]);

  const load = () => {
    API.get(`/admin/analytics?start=${start}&end=${end}`).then(r => setData(r.data)).catch(() => {});
  };

  const chartData = data?.revenueByDay?.map(d => ({
    date:    d._id?.slice(5),
    revenue: d.revenue,
    orders:  d.count,
  })) || [];

  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = chartData.reduce((s, d) => s + d.orders,  0);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Analytics & Reports</h1>

      {/* Date Range */}
      <div style={s.filterRow}>
        <div style={s.dateField}><label style={s.label}>From</label><input type="date" style={s.input} value={start} onChange={e => setStart(e.target.value)} /></div>
        <div style={s.dateField}><label style={s.label}>To</label><input type="date" style={s.input} value={end} onChange={e => setEnd(e.target.value)} /></div>
      </div>

      {/* Summary */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}><div style={s.summaryVal}>₹{totalRevenue.toLocaleString()}</div><div style={s.summaryLabel}>Total Revenue</div></div>
        <div style={s.summaryCard}><div style={s.summaryVal}>{totalOrders}</div><div style={s.summaryLabel}>Total Orders</div></div>
        <div style={s.summaryCard}><div style={s.summaryVal}>{totalOrders ? `₹${Math.round(totalRevenue / totalOrders)}` : '—'}</div><div style={s.summaryLabel}>Avg Order Value</div></div>
      </div>

      {/* Revenue Chart */}
      <div style={s.chartCard}>
        <h3 style={s.chartTitle}>Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1E3A8A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#1E3A8A" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart */}
      <div style={s.chartCard}>
        <h3 style={s.chartTitle}>Orders Per Day</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Drivers */}
      {data?.topDrivers?.length > 0 && (
        <div style={s.tableCard}>
          <h3 style={s.chartTitle}>Top Performing Drivers</h3>
          <table style={s.table}>
            <thead><tr>{['Rank', 'Driver', 'Phone', 'Trips', 'Earnings'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.topDrivers.map((d, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}><span style={{ fontWeight: 700, color: i < 3 ? '#F59E0B' : '#94A3B8' }}>#{i + 1}</span></td>
                  <td style={s.td}>{d.driver?.name || '—'}</td>
                  <td style={s.td}>{d.driver?.phone || '—'}</td>
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
  page:        { display: 'flex', flexDirection: 'column', gap: 20 },
  title:       { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  filterRow:   { display: 'flex', gap: 16 },
  dateField:   { display: 'flex', flexDirection: 'column', gap: 4 },
  label:       { fontSize: 12, fontWeight: 600, color: '#64748B' },
  input:       { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14 },
  summaryRow:  { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  summaryVal:  { fontSize: 28, fontWeight: 700, color: '#1E3A8A' },
  summaryLabel:{ fontSize: 13, color: '#64748B', marginTop: 4 },
  chartCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  chartTitle:  { fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  tableCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  tr:          { borderBottom: '1px solid #F1F5F9' },
  td:          { padding: '12px 14px', fontSize: 14, color: '#334155' },
};
