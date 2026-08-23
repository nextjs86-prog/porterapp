import React, { useState } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const AUDIENCES = [
  { value: 'all',       label: '👥 All Users (Customers + Drivers)' },
  { value: 'customers', label: '🙋 Customers Only'                   },
  { value: 'drivers',   label: '🚛 Drivers Only'                     },
];

export default function NotificationsPage() {
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [audience, setAudience] = useState('all');
  const [sending,  setSending]  = useState(false);

  const send = async () => {
    if (!title || !body) return toast.error('Fill title and message');
    setSending(true);
    try {
      const res = await API.post('/admin/notification/send', { title, body, audience });
      toast.success(res.data.message);
      setTitle(''); setBody('');
    } catch { toast.error('Failed to send'); }
    finally   { setSending(false); }
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>Push Notifications</h1>

      <div style={s.card}>
        <h3 style={s.cardTitle}>📣 Send Broadcast Notification</h3>

        <div style={s.field}>
          <label style={s.label}>Audience</label>
          <div style={s.audienceGrid}>
            {AUDIENCES.map(a => (
              <button
                key={a.value}
                style={{ ...s.audienceBtn, ...(audience === a.value ? s.audienceBtnActive : {}) }}
                onClick={() => setAudience(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Notification Title *</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Special Offer Today!" maxLength={60} />
          <span style={s.hint}>{title.length}/60 characters</span>
        </div>

        <div style={s.field}>
          <label style={s.label}>Message *</label>
          <textarea
            style={s.textarea} value={body} rows={4}
            onChange={e => setBody(e.target.value)}
            placeholder="Enter your notification message here..."
            maxLength={200}
          />
          <span style={s.hint}>{body.length}/200 characters</span>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div style={s.preview}>
            <div style={s.previewTitle}>📱 Preview</div>
            <div style={s.previewNotif}>
              <div style={s.previewApp}>🚚 QuickHaul</div>
              <div style={s.previewHead}>{title || 'Notification Title'}</div>
              <div style={s.previewBody}>{body || 'Message will appear here.'}</div>
            </div>
          </div>
        )}

        <button style={{ ...s.sendBtn, opacity: sending ? 0.7 : 1 }} onClick={send} disabled={sending}>
          {sending ? '📤 Sending...' : '🚀 Send Notification'}
        </button>
      </div>
    </div>
  );
}

const s = {
  page:            { display: 'flex', flexDirection: 'column', gap: 24 },
  title:           { fontSize: 22, fontWeight: 700, color: '#0F172A' },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 },
  cardTitle:       { fontSize: 16, fontWeight: 700, color: '#0F172A' },
  field:           { display: 'flex', flexDirection: 'column', gap: 6 },
  label:           { fontSize: 13, fontWeight: 600, color: '#64748B' },
  audienceGrid:    { display: 'flex', flexDirection: 'column', gap: 8 },
  audienceBtn:     { padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 14, textAlign: 'left', color: '#334155' },
  audienceBtnActive:{ borderColor: '#1E3A8A', backgroundColor: '#EFF6FF', color: '#1E3A8A', fontWeight: 600 },
  input:           { padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A' },
  textarea:        { padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A', resize: 'vertical' },
  hint:            { fontSize: 11, color: '#94A3B8' },
  preview:         { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16 },
  previewTitle:    { fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10 },
  previewNotif:    { backgroundColor: '#fff', borderRadius: 10, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  previewApp:      { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  previewHead:     { fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 },
  previewBody:     { fontSize: 13, color: '#64748B', lineHeight: 1.5 },
  sendBtn:         { backgroundColor: '#1E3A8A', color: '#fff', padding: '14px 32px', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
};
