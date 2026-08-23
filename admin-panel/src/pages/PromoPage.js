import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { code: '', discountType: 'percent', discountValue: 10, maxDiscount: '', minOrderValue: 0, usageLimit: '', expiresAt: '' };

export default function PromoPage() {
  const [promos,   setPromos]   = useState([]);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => API.get('/admin/promos').then(r => setPromos(r.data)).catch(() => {});
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.code || !form.discountValue) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await API.post('/admin/promo', form);
      toast.success('Promo created!');
      setForm(EMPTY_FORM); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promo?')) return;
    await API.delete(`/admin/promo/${id}`);
    toast.success('Deleted'); load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Promo Codes</h1>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Promo'}
        </button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Create Promo Code</h3>
          <div style={s.formGrid}>
            <div style={s.field}><label style={s.label}>Code *</label><input style={s.input} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" /></div>
            <div style={s.field}><label style={s.label}>Type</label>
              <select style={s.input} value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div style={s.field}><label style={s.label}>Value *</label><input style={s.input} type="number" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Max Discount (₹)</label><input style={s.input} type="number" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Min Order (₹)</label><input style={s.input} type="number" value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Usage Limit</label><input style={s.input} type="number" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Expires At</label><input style={s.input} type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} /></div>
          </div>
          <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
            {saving ? 'Creating...' : 'Create Promo'}
          </button>
        </div>
      )}

      <div style={s.grid}>
        {promos.map(p => (
          <div key={p._id} style={{ ...s.promoCard, opacity: p.isActive ? 1 : 0.5 }}>
            <div style={s.promoHeader}>
              <span style={s.promoCode}>{p.code}</span>
              <button style={s.deleteBtn} onClick={() => deletePromo(p._id)}>🗑️</button>
            </div>
            <div style={s.promoDiscount}>
              {p.discountType === 'percent' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
              {p.maxDiscount ? ` (max ₹${p.maxDiscount})` : ''}
            </div>
            <div style={s.promoMeta}>
              <span>Min ₹{p.minOrderValue}</span>
              <span>{p.usedCount}/{p.usageLimit || '∞'} used</span>
            </div>
            {p.expiresAt && <div style={s.promoExpiry}>Expires: {new Date(p.expiresAt).toLocaleDateString('en-IN')}</div>}
          </div>
        ))}
      </div>
      {promos.length === 0 && <div style={s.empty}>No promo codes yet</div>}
    </div>
  );
}

const s = {
  page:         { display: 'flex', flexDirection: 'column', gap: 20 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:        { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  addBtn:       { backgroundColor: '#1E3A8A', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  formCard:     { backgroundColor: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  formTitle:    { fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  formGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 },
  field:        { display: 'flex', flexDirection: 'column', gap: 4 },
  label:        { fontSize: 12, fontWeight: 600, color: '#64748B' },
  input:        { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A' },
  saveBtn:      { backgroundColor: '#1E3A8A', color: '#fff', padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  promoCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  promoHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  promoCode:    { fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#1E3A8A', letterSpacing: 2 },
  deleteBtn:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  promoDiscount:{ fontSize: 20, fontWeight: 700, color: '#22C55E', marginBottom: 8 },
  promoMeta:    { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 },
  promoExpiry:  { fontSize: 12, color: '#EF4444', marginTop: 4 },
  empty:        { textAlign: 'center', padding: 40, color: '#94A3B8' },
};
