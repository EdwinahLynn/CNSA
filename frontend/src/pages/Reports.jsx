import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

export default function Reports() {
  const { user } = useAuth();
  const [tab, setTab]         = useState('top-scorers');
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: 'top-scorers',       label: 'Top Scorers',         roles: ['CNSA_ADMIN','SCHOOL_ADMIN','COACH'] },
    { key: 'players-by-school', label: 'Players by School',   roles: ['CNSA_ADMIN'] },
    { key: 'injuries-summary',  label: 'Injuries Summary',    roles: ['CNSA_ADMIN','SCHOOL_ADMIN'] },
    { key: 'audit',             label: 'Audit Log',           roles: ['CNSA_ADMIN'] },
  ].filter(t => t.roles.includes(user?.role));

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/${tab}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={s.page}>
      <h2 style={s.title}>Reports</h2>
      <div style={localStyles.tabs}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...localStyles.tab, ...(tab === t.key ? localStyles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:'#888' }}>Loading...</p> : (
        <div style={s.card}>
          {tab === 'top-scorers' && <TopScorers data={data} />}
          {tab === 'players-by-school' && <PlayersBySchool data={data} />}
          {tab === 'injuries-summary' && <InjuriesSummary data={data} />}
          {tab === 'audit' && <AuditLog data={data} />}
        </div>
      )}
    </div>
  );
}

function TopScorers({ data }) {
  return (
    <table style={s.table}>
      <thead><tr>{['Rank','Player','Goals','Assists'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
      <tbody>
        {data.map((p, i) => (
          <tr key={p._id} style={s.tr}>
            <td style={s.td}>#{i + 1}</td>
            <td style={s.td}>{p.firstName} {p.lastName}</td>
            <td style={s.td}><strong style={{ color:'#e94560' }}>{p.totalGoals}</strong></td>
            <td style={s.td}>{p.totalAssists}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlayersBySchool({ data }) {
  return (
    <table style={s.table}>
      <thead><tr>{['School','Total Players','Active'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
      <tbody>
        {data.map(d => (
          <tr key={d._id} style={s.tr}>
            <td style={s.td}>{d.schoolName}</td>
            <td style={s.td}>{d.total}</td>
            <td style={s.td}><span style={{ color:'#27ae60' }}>{d.active}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InjuriesSummary({ data }) {
  return (
    <table style={s.table}>
      <thead><tr>{['Injury Status','Count'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
      <tbody>
        {data.map(d => (
          <tr key={d._id} style={s.tr}>
            <td style={s.td}>{d._id}</td>
            <td style={s.td}>{d.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuditLog({ data }) {
  return (
    <table style={s.table}>
      <thead><tr>{['Time','User','Role','Action','Entity','Record'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
      <tbody>
        {data.map(l => (
          <tr key={l._id} style={s.tr}>
            <td style={s.td}>{new Date(l.timestamp).toLocaleString()}</td>
            <td style={s.td}>{l.username || '—'}</td>
            <td style={s.td}>{l.role || '—'}</td>
            <td style={s.td}><span style={{ color:'#e94560' }}>{l.actionType}</span></td>
            <td style={s.td}>{l.affectedEntity}</td>
            <td style={s.td}>{l.affectedId || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const localStyles = {
  tabs:      { display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' },
  tab:       { padding:'0.5rem 1.25rem', background:'#1a1a2e', color:'#888', border:'1px solid #333', borderRadius:'6px', cursor:'pointer' },
  tabActive: { background:'#e94560', color:'#fff', border:'1px solid #e94560' }
};
