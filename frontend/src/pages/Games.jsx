import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

const EMPTY = { homeTeamId: '', awayTeamId: '', stadiumId: '', gameDate: '', homeTeamScore: 0, awayTeamScore: 0, attendance: '' };

export default function Games() {
  const { user } = useAuth();
  const [games, setGames]       = useState([]);
  const [teams, setTeams]       = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    api.get('/games').then(r => setGames(r.data));
    api.get('/teams').then(r => setTeams(r.data));
    api.get('/stadiums').then(r => setStadiums(r.data));
  }, []);

  const canWrite = ['CNSA_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/games/${editId}`, form);
        setGames(prev => prev.map(g => g._id === editId ? data : g));
        toast.success('Game updated');
      } else {
        const { data } = await api.post('/games', form);
        setGames(prev => [...prev, data]);
        toast.success('Game recorded');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (g) => {
    setForm({ homeTeamId: g.homeTeamId?._id||g.homeTeamId, awayTeamId: g.awayTeamId?._id||g.awayTeamId, stadiumId: g.stadiumId?._id||g.stadiumId, gameDate: g.gameDate?.slice(0,10)||'', homeTeamScore: g.homeTeamScore, awayTeamScore: g.awayTeamScore, attendance: g.attendance||'' });
    setEditId(g._id); setShowForm(true);
  };

  const teamLabel = (t) => `${t.schoolId?.schoolName||'?'} (${t.gender} · ${t.season})`;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Games</h2>
        {canWrite && <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} style={s.btn}>+ Record Game</button>}
      </div>

      <table style={s.table}>
        <thead><tr>{['Date','Home','Away','Score','Stadium','Attendance',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {games.map(g => (
            <tr key={g._id} style={s.tr}>
              <td style={s.td}>{new Date(g.gameDate).toLocaleDateString()}</td>
              <td style={s.td}>{g.homeTeamId?.schoolId?.schoolName || '—'}</td>
              <td style={s.td}>{g.awayTeamId?.schoolId?.schoolName || '—'}</td>
              <td style={s.td}><strong style={{ color:'#e94560' }}>{g.homeTeamScore} – {g.awayTeamScore}</strong></td>
              <td style={s.td}>{g.stadiumId?.stadiumName || '—'}</td>
              <td style={s.td}>{g.attendance?.toLocaleString() || '—'}</td>
              <td style={s.td}>{canWrite && <button onClick={() => openEdit(g)} style={s.smBtn}>Edit</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Overlay title={editId ? 'Edit Game' : 'Record Game'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label style={s.label}>Home Team *</label>
              <select value={form.homeTeamId} onChange={e => setForm({...form,homeTeamId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {teams.map(t => <option key={t._id} value={t._id}>{teamLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Away Team *</label>
              <select value={form.awayTeamId} onChange={e => setForm({...form,awayTeamId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {teams.map(t => <option key={t._id} value={t._id}>{teamLabel(t)}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Stadium *</label>
              <select value={form.stadiumId} onChange={e => setForm({...form,stadiumId:e.target.value})} style={s.input} required>
                <option value="">-- Select --</option>
                {stadiums.map(st => <option key={st._id} value={st._id}>{st.stadiumName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Game Date *</label>
              <input type="date" value={form.gameDate} onChange={e => setForm({...form,gameDate:e.target.value})} style={s.input} required />
            </div>
            <div>
              <label style={s.label}>Home Score</label>
              <input type="number" min="0" value={form.homeTeamScore} onChange={e => setForm({...form,homeTeamScore:+e.target.value})} style={s.input} />
            </div>
            <div>
              <label style={s.label}>Away Score</label>
              <input type="number" min="0" value={form.awayTeamScore} onChange={e => setForm({...form,awayTeamScore:+e.target.value})} style={s.input} />
            </div>
            <div>
              <label style={s.label}>Attendance</label>
              <input type="number" min="0" value={form.attendance} onChange={e => setForm({...form,attendance:e.target.value})} style={s.input} />
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
