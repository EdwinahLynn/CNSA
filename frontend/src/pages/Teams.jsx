import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams]       = useState([]);
  const [schools, setSchools]   = useState([]);
  const [coaches, setCoaches]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ schoolId: '', coachId: '', season: '', gender: 'Men' });
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data));
    api.get('/schools').then(r => setSchools(r.data));
    api.get('/coaches').then(r => setCoaches(r.data));
  }, []);

  const canWrite = ['CNSA_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/teams/${editId}`, form);
        setTeams(prev => prev.map(t => t._id === editId ? data : t));
        toast.success('Team updated');
      } else {
        const { data } = await api.post('/teams', form);
        setTeams(prev => [...prev, data]);
        toast.success('Team created');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (t) => {
    setForm({ schoolId: t.schoolId, coachId: t.coachId, season: t.season, gender: t.gender });
    setEditId(t._id); setShowForm(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Teams</h2>
        {canWrite && <button onClick={() => { setForm({ schoolId: user.schoolId||'', coachId:'', season:'', gender:'Men' }); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add Team</button>}
      </div>

      <div style={s.grid}>
        {teams.map(t => (
          <div key={t._id} style={s.card}>
            <div style={localStyles.cardTop}>
              <div>
                <h3 style={s.cardTitle}>{t.schoolName}</h3>
                <p style={s.cardMeta}>{t.gender} · {t.season}</p>
              </div>
              {canWrite && <button onClick={() => openEdit(t)} style={s.smBtn}>Edit</button>}
            </div>
            <p style={s.cardMeta}>Coach: {t.coachFirstName ? `${t.coachFirstName} ${t.coachLastName}` : '—'}</p>
            <p style={s.cardMeta}>Players: {t.players?.length || 0}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <Overlay title={editId ? 'Edit Team' : 'Add Team'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label style={s.label}>School *</label>
              <select value={form.schoolId} onChange={e => setForm({...form,schoolId:e.target.value,coachId:''})} style={s.input} required disabled={user?.role !== 'CNSA_ADMIN'}>
                <option value="">-- Select --</option>
                {schools.map(sc => <option key={sc._id} value={sc._id}>{sc.schoolName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Coach *</label>
              <select value={form.coachId} onChange={e => setForm({...form,coachId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {coaches.filter(c => !form.schoolId || Number(c.schoolId) === Number(form.schoolId)).map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Season *</label>
              <input value={form.season} onChange={e => setForm({...form,season:e.target.value})} style={s.input} placeholder="e.g. 2024-25" required />
            </div>
            <div>
              <label style={s.label}>Gender *</label>
              <select value={form.gender} onChange={e => setForm({...form,gender:e.target.value})} style={s.input}>
                <option>Men</option><option>Women</option><option>Mixed</option>
              </select>
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

const localStyles = {
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }
};
