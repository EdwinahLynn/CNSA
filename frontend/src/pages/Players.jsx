import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

const EMPTY = { firstName: '', lastName: '', sex: 'M', phoneNumber: '', email: '',
  streetAddress: '', postalCode: '', cityName: '', provinceName: '',
  schoolId: '', status: 'Active', recruitingRank: '', highSchool: '',
  positionIds: [], coachId: '' };

export default function Players() {
  const { user } = useAuth();
  const [players, setPlayers]     = useState([]);
  const [schools, setSchools]     = useState([]);
  const [coaches, setCoaches]     = useState([]);
  const [positions, setPositions] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState('');

  const canWrite = ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'].includes(user?.role);

  useEffect(() => {
    api.get('/players').then(r => setPlayers(r.data));
    api.get('/schools').then(r => setSchools(r.data));
    api.get('/coaches').then(r => setCoaches(r.data));
    api.get('/positions').then(r => setPositions(r.data));
  }, []);

  const filtered = players.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ ...EMPTY, schoolId: user.schoolId || '' });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      firstName: p.firstName, lastName: p.lastName, sex: p.sex,
      phoneNumber: p.phoneNumber || '', email: p.email || '',
      streetAddress: p.streetAddress, postalCode: p.postalCode,
      cityName: p.cityName, provinceName: p.provinceName,
      schoolId: p.schoolId, coachId: p.coachId || '',
      status: p.status, recruitingRank: p.recruitingRank || '',
      highSchool: p.highSchool || '',
      positionIds: p.positionIds || []
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/players/${editId}`, form);
        setPlayers(prev => prev.map(p => p._id === editId ? data : p));
        toast.success('Player updated');
      } else {
        const { data } = await api.post('/players', form);
        setPlayers(prev => [...prev, data]);
        toast.success('Player added');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving player');
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/players/${id}/status`, { status });
      setPlayers(prev => prev.map(p => p._id === id ? { ...p, status: data.status } : p));
      toast.success(`Status set to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Players</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={s.search} />
          {canWrite && <button onClick={openAdd} style={s.btn}>+ Add Player</button>}
        </div>
      </div>

      <table style={s.table}>
        <thead>
          <tr>{['Name','School','Coach','Status','Position','Rank',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p._id} style={s.tr}>
              <td style={s.td}><Link to={`/players/${p._id}`} style={{ color: '#e94560' }}>{p.firstName} {p.lastName}</Link></td>
              <td style={s.td}>{p.schoolName || '—'}</td>
              <td style={s.td}>{p.coachFirstName ? `${p.coachFirstName} ${p.coachLastName}` : '—'}</td>
              <td style={s.td}><StatusBadge status={p.status} /></td>
              <td style={s.td}>{p.positions || '—'}</td>
              <td style={s.td}>{p.recruitingRank || '—'}</td>
              <td style={s.td}>
                {canWrite && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEdit(p)} style={s.smBtn}>Edit</button>
                    {user?.role !== 'COACH' && (
                      <select value={p.status} onChange={e => handleStatus(p._id, e.target.value)} style={localStyles.select}>
                        {['Active','Graduated','Inactive'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal title={editId ? 'Edit Player' : 'Add Player'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={s.formGrid}>
            <Field label="First Name"    value={form.firstName}    onChange={v => setForm({...form, firstName: v})}    required />
            <Field label="Last Name"     value={form.lastName}     onChange={v => setForm({...form, lastName: v})}     required />
            <Field label="Sex" type="select" value={form.sex} onChange={v => setForm({...form, sex: v})} options={['M','F','O']} required />
            <Field label="Phone"         value={form.phoneNumber}  onChange={v => setForm({...form, phoneNumber: v})} />
            <Field label="Email"         value={form.email}        onChange={v => setForm({...form, email: v})} />
            <Field label="Street Address" value={form.streetAddress} onChange={v => setForm({...form, streetAddress: v})} required />
            <Field label="City"          value={form.cityName}     onChange={v => setForm({...form, cityName: v})}     required />
            <Field label="Province"      value={form.provinceName} onChange={v => setForm({...form, provinceName: v})} required />
            <Field label="Postal Code"   value={form.postalCode}   onChange={v => setForm({...form, postalCode: v})}   required />
            <Field label="High School" value={form.highSchool} onChange={v => setForm({...form, highSchool: v})} />
            <Field label="Recruiting Rank" type="number" value={form.recruitingRank} onChange={v => setForm({...form, recruitingRank: v})} />
            <Field label="School" type="select" value={form.schoolId} onChange={v => setForm({...form, schoolId: v, coachId: ''})}
              options={schools.map(s => ({ value: s._id, label: s.schoolName }))} required
              disabled={user?.role !== 'CNSA_ADMIN'} />
            <div>
              <label style={s.label}>Coach</label>
              <select
                value={user?.role === 'COACH' ? (user.coachId || '') : form.coachId}
                onChange={e => setForm({...form, coachId: e.target.value})}
                style={s.input}
                disabled={user?.role === 'COACH'}
              >
                <option value="">-- None --</option>
                {coaches
                  .filter(c => !form.schoolId || Number(c.schoolId) === Number(form.schoolId))
                  .map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName}</option>)}
              </select>
              {user?.role === 'COACH' && <p style={{ color:'#888', fontSize:'0.75rem', margin:'0.25rem 0 0' }}>Auto-assigned to you</p>}
            </div>
            <Field label="Status" type="select" value={form.status} onChange={v => setForm({...form, status: v})}
              options={['Active','Graduated','Inactive']} required />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>Positions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {positions.map(pos => (
                  <label key={pos._id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ccc', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.positionIds.includes(pos._id)}
                      onChange={e => setForm({ ...form, positionIds: e.target.checked
                        ? [...form.positionIds, pos._id]
                        : form.positionIds.filter(id => id !== pos._id)
                      })}
                    />
                    {pos.positionName}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={s.label}>Recruiting Incidents</label>
              <textarea value={form.recruitingIncidents} onChange={e => setForm({...form, recruitingIncidents: e.target.value})} style={{ ...s.input, height: '80px' }} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.btn}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { Active: '#27ae60', Graduated: '#2980b9', Inactive: '#7f8c8d' };
  return <span style={{ background: colors[status], color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{status}</span>;
}

function Field({ label, value, onChange, type = 'text', options, required, disabled }) {
  return (
    <div>
      <label style={s.label}>{label}{required && ' *'}</label>
      {type === 'select'
        ? <select value={value} onChange={e => onChange(e.target.value)} style={s.input} required={required} disabled={disabled}>
            <option value="">-- Select --</option>
            {options?.map(o => typeof o === 'object'
              ? <option key={o.value} value={o.value}>{o.label}</option>
              : <option key={o} value={o}>{o}</option>
            )}
          </select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={s.input} required={required} disabled={disabled} />
      }
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h3 style={{ margin: 0, color: '#e94560' }}>{title}</h3>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const localStyles = {
  select: { padding: '3px', borderRadius: '4px', border: '1px solid #333', background: '#0f0f1a', color: '#fff', fontSize: '0.8rem' }
};
