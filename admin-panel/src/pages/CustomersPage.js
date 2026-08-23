import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search,    setSearch]    = useState('');

  useEffect(() => { API.get('/admin/customers').then(r => setCustomers(r.data)).catch(() => {}); }, []);

  const toggleBlock = async (id) => {
    await API.put(`/admin/customer/${id}/block`);
    toast.success('Updated');
    setCustomers(cs => cs.map(c => c._id === id ? { ...c, isBlocked: !c.isBlocked } : c));
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Customers</h1>
        <input style={s.search} placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>{['Customer', 'Phone', 'Email', 'Referral Code', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c._id} style={s.tr}>
                <td style={s.td}><div style={s.nameCell}><span style={s.avatar}>👤</span><div><div style={s.name}>{c.name || 'No name'}</div></div></div></td>
                <td style={s.td}>{c.phone}</td>
                <td style={s.td}>{c.email || '—'}</td>
                <td style={s.td}><code style={s.code}>{c.referralCode || '—'}</code></td>
                <td style={s.td}>
                  <span style={{ ...s.badge, backgroundColor: c.isBlocked ? '#FEE2E2' : '#DCFCE7', color: c.isBlocked ? '#DC2626' : '#16A34A' }}>
                    {c.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td style={s.td}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={s.td}>
                  <button
                    style={{ ...s.btn, backgroundColor: c.isBlocked ? '#DBEAFE' : '#FEE2E2', color: c.isBlocked ? '#1D4ED8' : '#DC2626' }}
                    onClick={() => toggleBlock(c._id)}
                  >
                    {c.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={s.empty}>No customers found</div>}
      </div>
    </div>
  );
}

const s = {
  page:     { display: 'flex', flexDirection: 'column', gap: 20 },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:    { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  search:   { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, width: 280 },
  tableWrap:{ backgroundColor: '#fff', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:    { width: '100%', borderCollapse: 'collapse' },
  th:       { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  tr:       { borderBottom: '1px solid #F1F5F9' },
  td:       { padding: '14px 16px', fontSize: 13, color: '#334155' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:     { fontWeight: 600, color: '#0F172A' },
  badge:    { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  code:     { backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace' },
  btn:      { padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  empty:    { textAlign: 'center', padding: 40, color: '#94A3B8' },
};
