import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [appName,      setAppName]      = useState('QuickHaul');
  const [version,      setVersion]      = useState('1.0.0');
  const [maintenance,  setMaintenance]  = useState(false);
  const [surgeEnabled, setSurgeEnabled] = useState(false);
  const [surgeMulti,   setSurgeMulti]   = useState(1.5);

  const save = () => toast.success('Settings saved!');

  const Toggle = ({ label, desc, value, onChange }) => (
    <div style={s.toggleRow}>
      <div>
        <div style={s.toggleLabel}>{label}</div>
        {desc && <div style={s.toggleDesc}>{desc}</div>}
      </div>
      <div
        style={{ ...s.toggleSwitch, backgroundColor: value ? '#1E3A8A' : '#E2E8F0' }}
        onClick={() => onChange(!value)}
      >
        <div style={{ ...s.toggleThumb, transform: `translateX(${value ? 22 : 2}px)` }} />
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <h1 style={s.title}>App Settings</h1>

      <div style={s.card}>
        <h3 style={s.cardTitle}>General Configuration</h3>
        <div style={s.field}><label style={s.label}>App Name</label><input style={s.input} value={appName} onChange={e => setAppName(e.target.value)} /></div>
        <div style={s.field}><label style={s.label}>Version</label><input style={s.input} value={version} onChange={e => setVersion(e.target.value)} /></div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>App Controls</h3>
        <Toggle
          label="Maintenance Mode"
          desc="Disable the app for all users during maintenance"
          value={maintenance} onChange={setMaintenance}
        />
        <Toggle
          label="Surge Pricing"
          desc="Enable dynamic pricing during high demand"
          value={surgeEnabled} onChange={setSurgeEnabled}
        />
        {surgeEnabled && (
          <div style={{ ...s.field, marginTop: 12 }}>
            <label style={s.label}>Surge Multiplier (e.g. 1.5 = 50% extra)</label>
            <input style={{ ...s.input, maxWidth: 120 }} type="number" step="0.1" min="1" max="5" value={surgeMulti} onChange={e => setSurgeMulti(e.target.value)} />
          </div>
        )}
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>API Keys (Masked)</h3>
        {[
          { label: 'Google Maps API Key',  value: 'AIzaSy••••••••••••••••' },
          { label: 'Razorpay Key ID',      value: 'rzp_live_••••••••'      },
          { label: 'Firebase Project ID',  value: 'quickhaul-••••'         },
          { label: 'MSG91 Auth Key',       value: '••••••••••••••••••••'   },
        ].map(({ label, value }) => (
          <div key={label} style={s.field}>
            <label style={s.label}>{label}</label>
            <input style={{ ...s.input, color: '#94A3B8', fontFamily: 'monospace' }} value={value} readOnly />
          </div>
        ))}
        <p style={s.hint}>⚠️ API keys are configured in the backend .env file. Update them there for security.</p>
      </div>

      <button style={s.saveBtn} onClick={save}>💾 Save Settings</button>
    </div>
  );
}

const s = {
  page:        { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 },
  title:       { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 16 },
  cardTitle:   { fontSize: 15, fontWeight: 700, color: '#0F172A' },
  field:       { display: 'flex', flexDirection: 'column', gap: 4 },
  label:       { fontSize: 12, fontWeight: 600, color: '#64748B' },
  input:       { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A' },
  toggleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #F1F5F9' },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: '#0F172A' },
  toggleDesc:  { fontSize: 12, color: '#64748B', marginTop: 2 },
  toggleSwitch:{ width: 46, height: 26, borderRadius: 13, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', position: 'absolute', top: 2, transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  hint:        { fontSize: 12, color: '#F59E0B', backgroundColor: '#FFFBEB', padding: '10px 14px', borderRadius: 8 },
  saveBtn:     { alignSelf: 'flex-start', backgroundColor: '#1E3A8A', color: '#fff', padding: '14px 32px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
