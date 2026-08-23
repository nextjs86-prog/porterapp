import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  pending:    { bg: '#F1F5F9', color: '#64748B' },
  searching:  { bg: '#DBEAFE', color: '#1D4ED8' },
  accepted:   { bg: '#EDE9FE', color: '#7C3AED' },
  pickup:     { bg: '#FEF3C7', color: '#D97706' },
  in_transit: { bg: '#FFF7ED', color: '#EA580C' },
  delivered:  { bg: '#DCFCE7', color: '#16A34A' },
  cancelled:  { bg: '#FEE2E2', color: '#DC2626' },
};

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [page, status]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...(status && { status }) });
      const res = await API.get(`/admin/orders?${params}`);
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load orders'); }
    finally   { setLoading(false); }
  };

  const STATUSES = ['', 'pending', 'searching', 'accepted', 'pickup', 'in_transit', 'delivered', 'cancelled'];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Orders Management</h1>
        <span style={s.count}>{total} total orders</span>
      </div>

      {/* Filter */}
      <select style={s.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
        {STATUSES.map(st => <option key={st} value={st}>{st || 'All Status'}</option>)}
      </select>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>{['Order ID', 'Customer', 'Driver', 'Vehicle', 'Route', 'Fare', 'Status', 'Date'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</td></tr>
            ) : orders.map(o => {
              const sc = STATUS_MAP[o.status] || STATUS_MAP.pending;
              return (
                <tr key={o._id} style={s.tr}>
                  <td style={s.td}><code style={s.code}>#{o._id?.slice(-8)?.toUpperCase()}</code></td>
                  <td style={s.td}>{o.customer?.name || o.customer?.phone || '—'}</td>
                  <td style={s.td}>{o.driver?.name || <span style={{ color: '#94A3B8' }}>Unassigned</span>}</td>
                  <td style={s.td} className="capitalize">{o.vehicleType?.replace('_', ' ')}</td>
                  <td style={s.td}>
                    <div style={{ fontSize: 12 }}>
                      <div style={{ color: '#22C55E' }}>↑ {o.pickup?.address?.slice(0, 25)}...</div>
                      <div style={{ color: '#EF4444' }}>↓ {o.drop?.address?.slice(0, 25)}...</div>
                    </div>
                  </td>
                  <td style={s.td}><strong>₹{o.fareBreakdown?.total}</strong></td>
                  <td style={s.td}><span style={{ ...s.badge, backgroundColor: sc.bg, color: sc.color }}>{o.status}</span></td>
                  <td style={s.td}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && orders.length === 0 && <div style={s.empty}>No orders found</div>}
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {pages}</span>
        <button style={s.pageBtn} disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}

const s = {
  page:       { display: 'flex', flexDirection: 'column', gap: 20 },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:      { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  count:      { fontSize: 13, color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: 12 },
  select:     { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#334155', backgroundColor: '#fff', maxWidth: 200, cursor: 'pointer' },
  tableWrap:  { backgroundColor: '#fff', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:      { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  th:         { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' },
  tr:         { borderBottom: '1px solid #F1F5F9' },
  td:         { padding: '14px 16px', fontSize: 13, color: '#334155', verticalAlign: 'middle' },
  badge:      { padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  code:       { backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' },
  empty:      { textAlign: 'center', padding: 40, color: '#94A3B8' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 },
  pageBtn:    { padding: '8px 18px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' },
};
