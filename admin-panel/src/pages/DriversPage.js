import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['all', 'pending', 'approved', 'blocked'];
const FILE_BASE = 'https://porterapp-7y12.onrender.com';

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

const isImage = (url) => /\.(jpe?g|png|gif|webp)$/i.test(url || '');
const resolveFileUrl = (raw) => (!raw ? null : raw.startsWith('http') ? raw : `${FILE_BASE}/${raw.replace(/\\/g, '/')}`);

const DocCard = ({ label, doc }) => {
  const url = resolveFileUrl(doc?.url);
  return (
    <div style={s.docCard}>
      <div style={s.docHeader}>
        <span style={s.docLabel}>{label}</span>
        <span style={{ ...s.docBadge, backgroundColor: doc?.verified ? '#DCFCE7' : '#FEF3C7', color: doc?.verified ? '#16A34A' : '#D97706' }}>
          {doc?.verified ? 'Verified' : 'Pending'}
        </span>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" style={s.docLink}>
          {isImage(url) ? (
            <img src={url} alt={label} style={s.docImg} />
          ) : (
            <span style={s.docFileText}>📄 View document</span>
          )}
        </a>
      ) : (
        <span style={s.docMissing}>Not uploaded</span>
      )}
    </div>
  );
};

const DriverDetailModal = ({ driver, onClose, onApprove, onToggleBlock }) => {
  if (!driver) return null;
  const photoUrl = resolveFileUrl(driver.photo);
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>Driver Details</h2>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.modalBody}>
          <div style={s.profileRow}>
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" style={s.profilePhoto} />
            ) : (
              <div style={s.profilePhotoPlaceholder}>👤</div>
            )}
            <div>
              <div style={s.driverName}>{driver.name}</div>
              <Badge status={driver.isBlocked ? 'blocked' : driver.isApproved} />
            </div>
          </div>

          <div style={s.infoGrid}>
            <div style={s.infoItem}><span style={s.infoLabel}>Phone</span><span style={s.infoVal}>{driver.phone}</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Email</span><span style={s.infoVal}>{driver.email || '—'}</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Vehicle Type</span><span style={{ ...s.infoVal, textTransform: 'capitalize' }}>{driver.vehicleType?.replace('_', ' ')}</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Vehicle Number</span><span style={s.infoVal}>{driver.vehicleNumber}</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Rating</span><span style={s.infoVal}>⭐ {driver.rating} ({driver.totalRatings} ratings)</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Total Earnings</span><span style={s.infoVal}>₹{driver.totalEarnings || 0}</span></div>
            <div style={s.infoItem}><span style={s.infoLabel}>Registered On</span><span style={s.infoVal}>{new Date(driver.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
          </div>

          <h3 style={s.sectionTitle}>Documents</h3>
          <div style={s.docGrid}>
            <DocCard label="Driving License" doc={driver.documents?.drivingLicense} />
            <DocCard label="RC (Vehicle Registration)" doc={driver.documents?.rc} />
            <DocCard label="Aadhar Card" doc={driver.documents?.aadhar} />
          </div>
        </div>

        <div style={s.modalFooter}>
          {!driver.isApproved && !driver.isBlocked && (
            <button style={{ ...s.btn, ...s.btnGreen }} onClick={() => onApprove(driver._id)}>Approve Driver</button>
          )}
          <button style={{ ...s.btn, ...(driver.isBlocked ? s.btnBlue : s.btnRed) }} onClick={() => onToggleBlock(driver._id)}>
            {driver.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [tab,     setTab]     = useState('all');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

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
    toast.success('Driver approved'); setSelected(null); load();
  };
  const toggleBlock = async (id) => {
    await API.put(`/admin/driver/${id}/block`);
    toast.success('Updated'); setSelected(null); load();
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
                <td style={s.td}>
                  <div style={{ ...s.nameCell, cursor: 'pointer' }} onClick={() => setSelected(d)}>
                    <span style={s.avatar}>👤</span>{d.name}
                  </div>
                </td>
                <td style={s.td}>{d.phone}</td>
                <td style={s.td} className="capitalize">{d.vehicleType?.replace('_', ' ')}</td>
                <td style={s.td}>{d.vehicleNumber}</td>
                <td style={s.td}><Badge status={d.isBlocked ? 'blocked' : d.isApproved} /></td>
                <td style={s.td}>
                  <div style={s.actions}>
                    <button style={{ ...s.btn, ...s.btnGray }} onClick={() => setSelected(d)}>View</button>
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

      {selected && (
        <DriverDetailModal
          driver={selected}
          onClose={() => setSelected(null)}
          onApprove={approve}
          onToggleBlock={toggleBlock}
        />
      )}
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
  tableWrap:{ backgroundColor: '#fff', borderRadius: 14, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:    { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
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
  btnGray:  { backgroundColor: '#F1F5F9', color: '#334155' },
  empty:    { textAlign: 'center', padding: 40, color: '#94A3B8' },

  overlay:  { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal:    { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' },
  modalTitle:  { fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 },
  closeBtn:    { border: 'none', background: '#F1F5F9', width: 32, height: 32, borderRadius: 16, cursor: 'pointer', fontSize: 14, color: '#64748B' },
  modalBody:   { padding: 24, overflowY: 'auto' },
  profileRow:  { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  profilePhoto: { width: 64, height: 64, borderRadius: 32, objectFit: 'cover' },
  profilePhotoPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },
  driverName:  { fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 },
  infoGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 },
  infoItem:    { display: 'flex', flexDirection: 'column', gap: 4 },
  infoLabel:   { fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' },
  infoVal:     { fontSize: 14, color: '#0F172A', fontWeight: 600 },
  sectionTitle:{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 },
  docGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  docCard:     { border: '1px solid #E2E8F0', borderRadius: 10, padding: 10 },
  docHeader:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 6 },
  docLabel:    { fontSize: 12, fontWeight: 600, color: '#334155' },
  docBadge:    { fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 },
  docLink:     { display: 'block', textDecoration: 'none' },
  docImg:      { width: '100%', height: 90, objectFit: 'cover', borderRadius: 6, backgroundColor: '#F8FAFC' },
  docFileText: { fontSize: 12, color: '#1E3A8A', fontWeight: 600 },
  docMissing:  { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  modalFooter: { display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid #E2E8F0' },
};
