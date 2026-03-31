import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

const EMPTY = { playerId: '', gameId: '', injuryStatus: 'New', injuryCause: '', injuryLocation: '', surfaceType: 'Outdoor', notes: '' };

export default function Injuries() {
  const { user } = useAuth();
  const [injuries, setInjuries] = useState([]);
  const [players, setPlayers]   = useState([]);
  const [games, setGames]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    api.get('/injuries').then(r => setInjuries(r.data));
    api.get('/players').then(r => setPlayers(r.data));
    api.get('/games').then(r => setGames(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/injuries/${editId}`, form);
        setInjuries(prev => prev.map(i => i._id === editId ? data : i));
        toast.success('Injury updated');
      } else {
        const { data } = await api.post('/injuries', form);
        setInjuries(prev => [...prev, data]);
        toast.success('Injury recorded');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (i) => {
    setForm({ playerId: i.playerId, gameId: i.gameId, injuryStatus: i.injuryStatus, injuryCause: i.injuryCause||'', injuryLocation: i.injuryLocation||'', surfaceType: i.surfaceType||'Outdoor', notes: i.notes||'' });
    setEditId(i._id); setShowForm(true);
  };

  const statusColor = { 'New': '#e74c3c', 'From this soccer season': '#e67e22', 'From previous': '#7f8c8d' };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Injury Reports</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} style={s.btn}>+ Record Injury</button>
      </div>

      <table style={s.table}>
        <thead><tr>{['Player','Game Date','Status','Location','Cause','Surface',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {injuries.map(i => (
            <tr key={i._id} style={s.tr}>
              <td style={s.td}>{i.firstName ? `${i.firstName} ${i.lastName}` : '—'}</td>
              <td style={s.td}>{i.gameDate ? new Date(i.gameDate).toLocaleDateString() : '—'}</td>
              <td style={s.td}><span style={{ color: statusColor[i.injuryStatus] }}>{i.injuryStatus}</span></td>
              <td style={s.td}>{i.injuryLocation || '—'}</td>
              <td style={s.td}>{i.injuryCause || '—'}</td>
              <td style={s.td}>{i.surfaceType || '—'}</td>
              <td style={s.td}><button onClick={() => openEdit(i)} style={s.smBtn}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Overlay title={editId ? 'Edit Injury' : 'Record Injury'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label style={s.label}>Player *</label>
              <select value={form.playerId} onChange={e => setForm({...form,playerId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {players.map(p => <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Game *</label>
              <select value={form.gameId} onChange={e => setForm({...form,gameId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {games.map(g => <option key={g._id} value={g._id}>{new Date(g.gameDate).toLocaleDateString()} — {g.homeSchool} vs {g.awaySchool}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Status *</label>
              <select value={form.injuryStatus} onChange={e => setForm({...form,injuryStatus:e.target.value})} style={s.input}>
                <option>New</option><option>From this soccer season</option><option>From previous</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Surface</label>
              <select value={form.surfaceType} onChange={e => setForm({...form,surfaceType:e.target.value})} style={s.input}>
                <option>Indoor</option><option>Outdoor</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Injury Location</label>
              <input value={form.injuryLocation} onChange={e => setForm({...form,injuryLocation:e.target.value})} style={s.input} placeholder="e.g. Left knee" />
            </div>
            <div>
              <label style={s.label}>Cause</label>
              <input value={form.injuryCause} onChange={e => setForm({...form,injuryCause:e.target.value})} style={s.input} placeholder="e.g. Tackle" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={s.label}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} style={{ ...s.input, height:'80px' }} />
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
