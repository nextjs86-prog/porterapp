import React, { useEffect, useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const DEFAULT_PRICING = [
  { vehicleType: 'bike',        baseFare: 40,  perKmRate: 10, minFare: 40  },
  { vehicleType: 'mini_truck',  baseFare: 100, perKmRate: 18, minFare: 100 },
  { vehicleType: 'tempo',       baseFare: 150, perKmRate: 22, minFare: 150 },
  { vehicleType: 'large_truck', baseFare: 250, perKmRate: 30, minFare: 250 },
];

const ICONS = { bike: '🏍️', mini_truck: '🚐', tempo: '🚛', large_truck: '🚚' };

export default function PricingPage() {
  const [pricing,    setPricing]    = useState(DEFAULT_PRICING);
  const [commission, setCommission] = useState(20);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    API.get('/admin/pricing').then(r => {
      if (r.data.pricing?.length) setPricing(r.data.pricing);
      if (r.data.commissionPct)   setCommission(r.data.commissionPct);
    }).catch(() => {});
  }, []);

  const update = (idx, field, value) => {
    setPricing(prev => prev.map((p, i) => i === idx ? { ...p, [field]: Number(value) } : p));
  };

  const save = async () => {
    setSaving(true);
    try {
      await API.post('/admin/pricing', { pricing, commissionPct: commission });
      toast.success('Pricing updated!');
    } catch { toast.error('Failed to save'); }
    finally   { setSaving(false); }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>Pricing Configuration</h1>

      <div style={s.grid}>
        {pricing.map((p, i) => (
          <div key={p.vehicleType} style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.vehicleIcon}>{ICONS[p.vehicleType]}</span>
              <h3 style={s.vehicleName}>{p.vehicleType?.replace('_', ' ').toUpperCase()}</h3>
            </div>
            <div style={s.fields}>
              {[
                { field: 'baseFare',  label: 'Base Fare (₹)'    },
                { field: 'perKmRate', label: 'Per KM Rate (₹)'  },
                { field: 'minFare',   label: 'Minimum Fare (₹)' },
              ].map(({ field, label }) => (
                <div key={field} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input
                    style={s.input} type="number" min="0"
                    value={p[field]}
                    onChange={e => update(i, field, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div style={s.preview}>
              <span>5 km estimate: </span>
              <strong>₹{Math.max(p.baseFare + 5 * p.perKmRate, p.minFare)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={s.commissionCard}>
        <h3 style={s.sectionTitle}>Platform Commission</h3>
        <div style={s.commissionRow}>
          <label style={s.label}>Commission Percentage (%)</label>
          <input
            style={{ ...s.input, maxWidth: 120 }} type="number" min="0" max="50"
            value={commission} onChange={e => setCommission(Number(e.target.value))}
          />
        </div>
        <p style={s.hint}>This % is deducted from each order's fare. Driver receives the remaining {100 - commission}%.</p>
      </div>

      <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
        {saving ? 'Saving...' : '💾 Save Pricing'}
      </button>
    </div>
  );
}

const s = {
  page:          { display: 'flex', flexDirection: 'column', gap: 24 },
  title:         { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card:          { backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardHeader:    { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' },
  vehicleIcon:   { fontSize: 28 },
  vehicleName:   { fontSize: 14, fontWeight: 700, color: '#0F172A' },
  fields:        { display: 'flex', flexDirection: 'column', gap: 12 },
  field:         { display: 'flex', flexDirection: 'column', gap: 4 },
  label:         { fontSize: 12, fontWeight: 600, color: '#64748B' },
  input:         { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A' },
  preview:       { marginTop: 12, padding: '8px 12px', backgroundColor: '#EFF6FF', borderRadius: 8, fontSize: 13, color: '#1D4ED8' },
  commissionCard:{ backgroundColor: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', maxWidth: 400 },
  sectionTitle:  { fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 14 },
  commissionRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 },
  hint:          { fontSize: 12, color: '#94A3B8' },
  saveBtn:       { alignSelf: 'flex-start', backgroundColor: '#1E3A8A', color: '#fff', padding: '14px 32px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
