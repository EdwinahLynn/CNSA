import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

export default function PlayerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [player, setPlayer]           = useState(null);
  const [injuries, setInjuries]       = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [incidents, setIncidents]     = useState([]);
  const [rankings, setRankings]       = useState([]);

  const [incidentForm, setIncidentForm] = useState({ description: '', incidentDate: '' });
  const [rankingForm,  setRankingForm]  = useState({ rankingValue: '', rankingYear: new Date().getFullYear() });
  const [showIncForm,  setShowIncForm]  = useState(false);
  const [showRankForm, setShowRankForm] = useState(false);

  const canWrite = ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'].includes(user?.role);
  const canAdmin = ['CNSA_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role);

  useEffect(() => {
    api.get(`/players/${id}`).then(r => setPlayer(r.data));
    api.get('/injuries').then(r => setInjuries(r.data.filter(i => String(i.playerId) === id)));
    api.get('/scholarships').then(r => setScholarships(r.data.filter(sc => String(sc.playerId) === id)));
    api.get(`/recruiting-incidents/player/${id}`).then(r => setIncidents(r.data));
    api.get(`/recruiting-rankings/player/${id}`).then(r => setRankings(r.data));
  }, [id]);

  const addIncident = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/recruiting-incidents', { ...incidentForm, playerId: id });
      setIncidents(prev => [data, ...prev]);
      setIncidentForm({ description: '', incidentDate: '' });
      setShowIncForm(false);
      toast.success('Incident recorded');
    } catch { toast.error('Failed to save'); }
  };

  const deleteIncident = async (incId) => {
    if (!confirm('Delete this incident?')) return;
    await api.delete(`/recruiting-incidents/${incId}`);
    setIncidents(prev => prev.filter(i => i._id !== incId));
    toast.success('Deleted');
  };

  const addRanking = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/recruiting-rankings', { ...rankingForm, playerId: id });
      setRankings(prev => [data, ...prev]);
      setRankingForm({ rankingValue: '', rankingYear: new Date().getFullYear() });
      setShowRankForm(false);
      toast.success('Ranking added');
    } catch { toast.error('Failed to save'); }
  };

  const deleteRanking = async (rankId) => {
    if (!confirm('Delete this ranking?')) return;
    await api.delete(`/recruiting-rankings/${rankId}`);
    setRankings(prev => prev.filter(r => r._id !== rankId));
    toast.success('Deleted');
  };

  if (!player) return <div style={s.page}>Loading...</div>;

  return (
    <div style={s.page}>
      <Link to="/players" style={ls.back}>← Back to Players</Link>
      <div style={s.header}>
        <div>
          <h2 style={ls.name}>{player.firstName} {player.lastName}</h2>
          <p style={ls.meta}>{player.schoolName} · {player.sex === 'M' ? 'Male' : player.sex === 'F' ? 'Female' : 'Other'}</p>
        </div>
        <StatusBadge status={player.status} />
      </div>

      <div style={s.grid}>
        <Section title="Personal Info">
          <Row label="Email"          value={player.email} />
          <Row label="Phone"          value={player.phoneNumber} />
          <Row label="Address"        value={`${player.streetAddress}, ${player.cityName}, ${player.provinceName} ${player.postalCode}`} />
          <Row label="High School"    value={player.highSchool} />
          <Row label="Recruit Source" value={player.sourceName} />
          <Row label="Coach"          value={player.coachFirstName ? `${player.coachFirstName} ${player.coachLastName}` : null} />
          <Row label="Positions"      value={player.positions} />
        </Section>

        <Section title={`Rankings (${rankings.length})`} action={canAdmin && <button onClick={() => setShowRankForm(v => !v)} style={s.smBtn}>+ Add</button>}>
          {showRankForm && (
            <form onSubmit={addRanking} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
              <input type="number" placeholder="Rank value" min="1" value={rankingForm.rankingValue} onChange={e => setRankingForm({...rankingForm, rankingValue: e.target.value})} style={{ ...s.input, width:'120px' }} required />
              <input type="number" placeholder="Year" value={rankingForm.rankingYear} onChange={e => setRankingForm({...rankingForm, rankingYear: e.target.value})} style={{ ...s.input, width:'100px' }} required />
              <button type="submit" style={s.smBtn}>Save</button>
              <button type="button" onClick={() => setShowRankForm(false)} style={s.cancelBtn}>Cancel</button>
            </form>
          )}
          {rankings.length === 0 ? <p style={ls.empty}>No rankings recorded</p> :
            rankings.map(r => (
              <div key={r._id} style={ls.item}>
                <span style={{ color: '#e94560', fontWeight: 600 }}>#{r.rankingValue}</span>
                <span style={{ color: '#888' }}> · {r.rankingYear}</span>
                {canAdmin && <button onClick={() => deleteRanking(r._id)} style={{ ...s.smBtn, background:'#7f8c8d', marginLeft:'0.5rem', padding:'2px 8px', fontSize:'0.75rem' }}>✕</button>}
              </div>
            ))}
        </Section>

        <Section title={`Scholarships (${scholarships.length})`}>
          {scholarships.length === 0 ? <p style={ls.empty}>None recorded</p> :
            scholarships.map(sc => (
              <div key={sc._id} style={ls.item}>
                <strong style={{ color: '#ddd' }}>{sc.scholarshipName}</strong>
                <span style={{ color: '#888' }}> — ${sc.scholarshipAmount?.toLocaleString()} · {new Date(sc.dateAwarded).toLocaleDateString()}</span>
              </div>
            ))}
        </Section>

        <Section title={`Injuries (${injuries.length})`}>
          {injuries.length === 0 ? <p style={ls.empty}>None recorded</p> :
            injuries.map(i => (
              <div key={i._id} style={ls.item}>
                <span style={{ color: '#e94560' }}>{i.injuryStatus}</span>
                <span style={{ color: '#888' }}> · {i.injuryLocation} · {i.injuryCause}</span>
              </div>
            ))}
        </Section>

        <Section title={`Recruiting Incidents (${incidents.length})`} action={canWrite && <button onClick={() => setShowIncForm(v => !v)} style={s.smBtn}>+ Add</button>}>
          {showIncForm && (
            <form onSubmit={addIncident} style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <input type="date" value={incidentForm.incidentDate} onChange={e => setIncidentForm({...incidentForm, incidentDate: e.target.value})} style={s.input} required />
              <textarea placeholder="Description" value={incidentForm.description} onChange={e => setIncidentForm({...incidentForm, description: e.target.value})} style={{ ...s.input, height:'70px' }} required />
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button type="submit" style={s.smBtn}>Save</button>
                <button type="button" onClick={() => setShowIncForm(false)} style={s.cancelBtn}>Cancel</button>
              </div>
            </form>
          )}
          {incidents.length === 0 ? <p style={ls.empty}>No incidents recorded</p> :
            incidents.map(i => (
              <div key={i._id} style={ls.item}>
                <span style={{ color: '#e67e22' }}>{new Date(i.incidentDate).toLocaleDateString()}</span>
                <span style={{ color: '#ddd' }}> — {i.description}</span>
                {canAdmin && <button onClick={() => deleteIncident(i._id)} style={{ ...s.smBtn, background:'#7f8c8d', marginLeft:'0.5rem', padding:'2px 8px', fontSize:'0.75rem' }}>✕</button>}
              </div>
            ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div style={ls.section}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', borderBottom:'1px solid #333', paddingBottom:'0.5rem' }}>
        <h3 style={ls.sectionTitle}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={ls.row}>
      <span style={ls.rowLabel}>{label}</span>
      <span style={ls.rowValue}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { Active: '#27ae60', Graduated: '#2980b9', Inactive: '#7f8c8d' };
  return <span style={{ background: colors[status], color: '#fff', padding: '4px 12px', borderRadius: '6px', fontWeight: '600' }}>{status}</span>;
}

const ls = {
  back:         { color: '#888', textDecoration: 'none', fontSize: '0.9rem' },
  name:         { color: '#e94560', margin: '0 0 0.25rem' },
  meta:         { color: '#888', margin: 0 },
  section:      { background: '#1a1a2e', borderRadius: '10px', padding: '1.25rem' },
  sectionTitle: { color: '#e94560', margin: 0, fontSize: '1rem' },
  row:          { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  rowLabel:     { color: '#888', fontSize: '0.85rem' },
  rowValue:     { color: '#ddd', fontSize: '0.85rem', textAlign: 'right' },
  item:         { marginBottom: '0.5rem', fontSize: '0.9rem' },
  empty:        { color: '#555', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }
};
