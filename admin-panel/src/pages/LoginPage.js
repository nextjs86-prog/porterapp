import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAdminStore from '../store/useAdminStore';

export default function LoginPage() {
  const [email,    setEmail]    = useState('admin@porter.com');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const login    = useAdminStore(s => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      toast.error('Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🚚</div>
        <h1 style={s.title}>QuickHaul Admin</h1>
        <p style={s.sub}>Sign in to your admin account</p>

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight: '100vh', backgroundColor: '#1E3A8A', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card:  { backgroundColor: '#fff', borderRadius: 20, padding: 40, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  logo:  { fontSize: 52, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 700, color: '#0F172A', textAlign: 'center' },
  sub:   { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28 },
  form:  { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#64748B' },
  input: { padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, outline: 'none' },
  btn:   { backgroundColor: '#1E3A8A', color: '#fff', padding: '14px', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
};
