import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['all', 'pending', 'approved', 'blocked'];

const Badge = ({ status }) => {
  const map = {
    true:  { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
    false: { bg: '#FEF3C7', color: '#D97706', label: 'Pending'  },
    blocked:{ bg: '#FEE2E2', color: '#DC2626', label: 'Blocked' },
  };
  const key = status === 'blocked' ? 'blocked' : String(status);
  const c = map[key] || map.false;
  return <span style={{ ...s.badge, backgroundColor: c.bg, color: c.color }}>{c.label}</span>;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [tab,     setTab]     = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [tab]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/drivers?status=${tab === 'all' ? '' : tab}`);
      setDrivers(res.data);
    } catch { toast.error('Failed to load drivers'); }
    finally   { setLoading(false); }
  };

  const approve = async (id) => {
    await API.put(`/admin/driver/${id}/approve`);
    toast.success('Driver approved'); load();
  };
  const toggleBlock = async (id) => {
    await API.put(`/admin/driver/${id}/block`);
    toast.success('Updated'); load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Drivers Management</h1>
        <span style={s.count}>{drivers.length} drivers</span>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>{['Name','Phone','Vehicle','Number','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</td></tr>
            ) : drivers.map(d => (
              <tr key={d._id} style={s.tr}>
                <td style={s.td}><div style={s.nameCell}><span style={s.avatar}>👤</span>{d.name}</div></td>
                <td style={s.td}>{d.phone}</td>
                <td style={s.td} className="capitalize">{d.vehicleType?.replace('_', ' ')}</td>
                <td style={s.td}>{d.vehicleNumber}</td>
                <td style={s.td}><Badge status={d.isBlocked ? 'blocked' : d.isApproved} /></td>
                <td style={s.td}>
                  <div style={s.actions}>
                    {!d.isApproved && !d.isBlocked && (
                      <button style={{ ...s.btn, ...s.btnGreen }} onClick={() => approve(d._id)}>Approve</button>
                    )}
                    <button style={{ ...s.btn, ...(d.isBlocked ? s.btnBlue : s.btnRed) }} onClick={() => toggleBlock(d._id)}>
                      {d.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && drivers.length === 0 && (
          <div style={s.empty}>No drivers found</div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:     { display: 'flex', flexDirection: 'column', gap: 20 },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:    { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  count:    { fontSize: 13, color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 12px', borderRadius: 12 },
  tabs:     { display: 'flex', gap: 8 },
  tab:      { padding: '8px 18px', borderRadius: 20, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B' },
  tabActive:{ backgroundColor: '#1E3A8A', color: '#fff', borderColor: '#1E3A8A' },
  tableWrap:{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:    { width: '100%', borderCollapse: 'collapse' },
  th:       { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  tr:       { borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' },
  td:       { padding: '14px 16px', fontSize: 14, color: '#334155' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:   { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge:    { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  actions:  { display: 'flex', gap: 8 },
  btn:      { padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnGreen: { backgroundColor: '#DCFCE7', color: '#16A34A' },
  btnRed:   { backgroundColor: '#FEE2E2', color: '#DC2626' },
  btnBlue:  { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  empty:    { textAlign: 'center', padding: 40, color: '#94A3B8' },
};
