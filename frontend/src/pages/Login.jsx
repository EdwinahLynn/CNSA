import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>CNSA</h1>
        <p style={styles.sub}>Canadian National Soccer Association</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input style={styles.input} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a' },
  card:  { background: '#1a1a2e', padding: '2.5rem', borderRadius: '12px', width: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  title: { color: '#e94560', textAlign: 'center', margin: '0 0 0.25rem' },
  sub:   { color: '#888', textAlign: 'center', fontSize: '0.85rem', marginBottom: '2rem' },
  form:  { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  label: { color: '#ccc', fontSize: '0.85rem' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #333', background: '#0f0f1a', color: '#fff', fontSize: '1rem' },
  btn:   { marginTop: '0.5rem', padding: '0.75rem', background: '#e94560', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }
};
