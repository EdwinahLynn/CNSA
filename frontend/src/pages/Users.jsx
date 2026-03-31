import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { s } from '../styles/shared.js';

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [schools, setSchools] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ username: '', password: '', role: 'SCHOOL_ADMIN', schoolId: '', coachId: '' });

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data));
    api.get('/schools').then(r => setSchools(r.data));
    api.get('/coaches').then(r => setCoaches(r.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', form);
      setUsers(prev => [...prev, data]);
      toast.success('User created');
      setShowForm(false);
      setForm({ username: '', password: '', role: 'SCHOOL_ADMIN', schoolId: '', coachId: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.patch(`/auth/users/${id}/deactivate`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: false } : u));
      toast.success('User deactivated');
    } catch { toast.error('Failed to deactivate'); }
  };

  const roleColor = { CNSA_ADMIN: '#e94560', SCHOOL_ADMIN: '#2980b9', COACH: '#27ae60' };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>User Management</h2>
        <button onClick={() => setShowForm(true)} style={s.btn}>+ Create User</button>
      </div>

      <table style={s.table}>
        <thead><tr>{['Username','Role','School','Status',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} style={s.tr}>
              <td style={s.td}>{u.username}</td>
              <td style={s.td}><span style={{ background: roleColor[u.role], color:'#fff', padding:'2px 8px', borderRadius:'4px', fontSize:'0.75rem' }}>{u.role}</span></td>
              <td style={s.td}>{u.schoolName || '—'}</td>
              <td style={s.td}><span style={{ color: u.isActive ? '#27ae60' : '#7f8c8d' }}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
              <td style={s.td}>
                {u.isActive && <button onClick={() => handleDeactivate(u._id)} style={{ ...s.smBtn, background:'#7f8c8d' }}>Deactivate</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, color:'#e94560' }}>Create User</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', color:'#888', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={s.label}>Username *</label>
                <input value={form.username} onChange={e => setForm({...form,username:e.target.value})} style={s.input} required />
              </div>
              <div>
                <label style={s.label}>Password * (min 6 chars)</label>
                <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} style={s.input} minLength={6} required />
              </div>
              <div>
                <label style={s.label}>Role *</label>
                <select value={form.role} onChange={e => setForm({...form,role:e.target.value})} style={s.input}>
                  <option value="CNSA_ADMIN">CNSA Admin</option>
                  <option value="SCHOOL_ADMIN">School Admin</option>
                  <option value="COACH">Coach</option>
                </select>
              </div>
              {form.role !== 'CNSA_ADMIN' && (
                <div>
                  <label style={s.label}>School *</label>
                  {schools.length === 0
                    ? <p style={{ color: '#e67e22', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        No schools exist yet. Add a school first before creating this user.
                      </p>
                    : <select value={form.schoolId} onChange={e => setForm({...form,schoolId:e.target.value,coachId:''})} style={s.input} required>
                        <option value="">-- Select School --</option>
                        {schools.map(sc => <option key={sc._id} value={sc._id}>{sc.schoolName}</option>)}
                      </select>
                  }
                </div>
              )}
              {form.role === 'COACH' && (
                <div>
                  <label style={s.label}>Link to Coach Profile *</label>
                  {coaches.filter(c => !form.schoolId || Number(c.schoolId) === Number(form.schoolId)).length === 0
                    ? <p style={{ color: '#e67e22', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        No coaches exist for this school yet. Add a coach profile first.
                      </p>
                    : <select value={form.coachId} onChange={e => setForm({...form,coachId:e.target.value})} style={s.input} required>
                        <option value="">-- Select Coach --</option>
                        {coaches
                          .filter(c => !form.schoolId || Number(c.schoolId) === Number(form.schoolId))
                          .map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
                      </select>
                  }
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.btn}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
