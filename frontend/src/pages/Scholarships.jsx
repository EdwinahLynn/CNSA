import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

export default function Scholarships() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [players, setPlayers]           = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ playerId: '', scholarshipName: '', scholarshipAmount: '', dateAwarded: '' });
  const [editId, setEditId]             = useState(null);

  useEffect(() => {
    api.get('/scholarships').then(r => setScholarships(r.data));
    api.get('/players').then(r => setPlayers(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/scholarships/${editId}`, form);
        setScholarships(prev => prev.map(s => s._id === editId ? data : s));
        toast.success('Scholarship updated');
      } else {
        const { data } = await api.post('/scholarships', form);
        setScholarships(prev => [...prev, data]);
        toast.success('Scholarship recorded');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (s) => {
    setForm({ playerId: s.playerId, scholarshipName: s.scholarshipName, scholarshipAmount: s.scholarshipAmount||'', dateAwarded: s.dateAwarded?.slice(0,10)||'' });
    setEditId(s._id); setShowForm(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Scholarships</h2>
        <button onClick={() => { setForm({ playerId:'', scholarshipName:'', scholarshipAmount:'', dateAwarded:'' }); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add Scholarship</button>
      </div>

      <table style={s.table}>
        <thead><tr>{['Player','School','Scholarship','Amount','Date Awarded',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {scholarships.map(sc => (
            <tr key={sc._id} style={s.tr}>
              <td style={s.td}>{sc.firstName ? `${sc.firstName} ${sc.lastName}` : '—'}</td>
              <td style={s.td}>{sc.schoolName || '—'}</td>
              <td style={s.td}>{sc.scholarshipName}</td>
              <td style={s.td}>{sc.scholarshipAmount ? `$${sc.scholarshipAmount.toLocaleString()}` : '—'}</td>
              <td style={s.td}>{new Date(sc.dateAwarded).toLocaleDateString()}</td>
              <td style={s.td}><button onClick={() => openEdit(sc)} style={s.smBtn}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Overlay title={editId ? 'Edit Scholarship' : 'Add Scholarship'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={s.label}>Player *</label>
              <select value={form.playerId} onChange={e => setForm({...form,playerId:e.target.value})} style={s.input} required>
                <option value="">-- Select Player --</option>
                {players.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.schoolName})</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Scholarship Name *</label>
              <input value={form.scholarshipName} onChange={e => setForm({...form,scholarshipName:e.target.value})} style={s.input} required />
            </div>
            <div>
              <label style={s.label}>Amount ($)</label>
              <input type="number" min="0" step="0.01" value={form.scholarshipAmount} onChange={e => setForm({...form,scholarshipAmount:e.target.value})} style={s.input} />
            </div>
            <div>
              <label style={s.label}>Date Awarded *</label>
              <input type="date" value={form.dateAwarded} onChange={e => setForm({...form,dateAwarded:e.target.value})} style={s.input} required />
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.btn}>Save</button>
            </div>
          </form>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ title, onClose, children }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h3 style={{ margin:0, color:'#e94560' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
