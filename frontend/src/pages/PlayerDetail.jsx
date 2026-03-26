import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { s } from '../styles/shared.js';

export default function PlayerDetail() {
  const { id } = useParams();
  const [player, setPlayer]           = useState(null);
  const [injuries, setInjuries]       = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [games, setGames]             = useState([]);

  useEffect(() => {
    api.get(`/players/${id}`).then(r => setPlayer(r.data));
    api.get('/injuries').then(r => setInjuries(r.data.filter(i => i.playerId?._id === id || i.playerId === id)));
    api.get('/scholarships').then(r => setScholarships(r.data.filter(s => s.playerId?._id === id || s.playerId === id)));
    api.get('/games').then(r => {
      const playerGames = r.data.filter(g => g.playerStats?.some(ps => ps.playerId?._id === id || ps.playerId === id));
      setGames(playerGames);
    });
  }, [id]);

  if (!player) return <div style={s.page}>Loading...</div>;

  return (
    <div style={s.page}>
      <Link to="/players" style={localStyles.back}>← Back to Players</Link>
      <div style={s.header}>
        <div>
          <h2 style={localStyles.name}>{player.firstName} {player.lastName}</h2>
          <p style={localStyles.meta}>{player.schoolId?.schoolName} · {player.sex === 'M' ? 'Male' : player.sex === 'F' ? 'Female' : 'Other'}</p>
        </div>
        <StatusBadge status={player.status} />
      </div>

      <div style={s.grid}>
        <Section title="Personal Info">
          <Row label="Email"         value={player.email} />
          <Row label="Phone"         value={player.phoneNumber} />
          <Row label="Address"       value={`${player.streetAddress}, ${player.cityName}, ${player.provinceName} ${player.postalCode}`} />
          <Row label="High School"   value={player.highSchool} />
          <Row label="Recruit Rank"  value={player.recruitingRank} />
          <Row label="Recruit Source" value={player.recruitSourceId?.sourceName} />
          <Row label="Positions"     value={player.positions?.map(p => p.positionName).join(', ')} />
        </Section>

        <Section title={`Scholarships (${scholarships.length})`}>
          {scholarships.length === 0 ? <p style={localStyles.empty}>None recorded</p> :
            scholarships.map(s => (
              <div key={s._id} style={localStyles.item}>
                <strong style={{ color: '#ddd' }}>{s.scholarshipName}</strong>
                <span style={{ color: '#888' }}> — ${s.scholarshipAmount?.toLocaleString()} · {new Date(s.dateAwarded).toLocaleDateString()}</span>
              </div>
            ))}
        </Section>

        <Section title={`Injuries (${injuries.length})`}>
          {injuries.length === 0 ? <p style={localStyles.empty}>None recorded</p> :
            injuries.map(i => (
              <div key={i._id} style={localStyles.item}>
                <span style={{ color: '#e94560' }}>{i.injuryStatus}</span>
                <span style={{ color: '#888' }}> · {i.injuryLocation} · {i.injuryCause}</span>
              </div>
            ))}
        </Section>

        <Section title={`Games (${games.length})`}>
          {games.length === 0 ? <p style={localStyles.empty}>None recorded</p> :
            games.map(g => {
              const stat = g.playerStats?.find(ps => ps.playerId?._id === id || ps.playerId === id);
              return (
                <div key={g._id} style={localStyles.item}>
                  <span style={{ color: '#ddd' }}>{new Date(g.gameDate).toLocaleDateString()}</span>
                  <span style={{ color: '#888' }}> — G:{stat?.goals||0} A:{stat?.assists||0} YC:{stat?.yellowCards||0} RC:{stat?.redCards||0}</span>
                </div>
              );
            })}
        </Section>

        {player.recruitingIncidents && (
          <Section title="Recruiting Incidents">
            <p style={{ color: '#e74c3c' }}>{player.recruitingIncidents}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={localStyles.section}>
      <h3 style={localStyles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={localStyles.row}>
      <span style={localStyles.rowLabel}>{label}</span>
      <span style={localStyles.rowValue}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { Active: '#27ae60', Graduated: '#2980b9', Inactive: '#7f8c8d' };
  return <span style={{ background: colors[status], color: '#fff', padding: '4px 12px', borderRadius: '6px', fontWeight: '600' }}>{status}</span>;
}

const localStyles = {
  back:        { color: '#888', textDecoration: 'none', fontSize: '0.9rem' },
  name:        { color: '#e94560', margin: '0 0 0.25rem' },
  meta:        { color: '#888', margin: 0 },
  section:     { background: '#1a1a2e', borderRadius: '10px', padding: '1.25rem' },
  sectionTitle:{ color: '#e94560', margin: '0 0 1rem', fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  row:         { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  rowLabel:    { color: '#888', fontSize: '0.85rem' },
  rowValue:    { color: '#ddd', fontSize: '0.85rem', textAlign: 'right' },
  item:        { marginBottom: '0.5rem', fontSize: '0.9rem' },
  empty:       { color: '#555', fontStyle: 'italic', fontSize: '0.85rem' }
};
