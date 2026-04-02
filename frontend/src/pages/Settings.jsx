import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { s } from '../styles/shared.js';

export default function Settings() {
  const [tab, setTab] = useState('highSchools');

  return (
    <div style={s.page}>
      <h2 style={s.title}>Settings — Lookup Tables</h2>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {[['highSchools','High Schools'],['provincialOrgs','Provincial Organizations']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'0.5rem 1.25rem', background: tab===key ? '#e94560' : '#1a1a2e', color: tab===key ? '#fff' : '#888',
              border:'1px solid #333', borderRadius:'6px', cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'highSchools'    && <HighSchools />}
      {tab === 'provincialOrgs' && <ProvincialOrgs />}
    </div>
  );
}

function HighSchools() {
  const [items, setItems]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const EMPTY = { highSchoolName: '', postalCode: '', cityName: '', provinceName: '' };
  const [form, setForm]         = useState(EMPTY);

  useEffect(() => { api.get('/high-schools').then(r => setItems(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/high-schools/${editId}`, form);
        setItems(prev => prev.map(i => i._id === editId ? data : i));
        toast.success('Updated');
      } else {
        const { data } = await api.post('/high-schools', form);
        setItems(prev => [...prev, data]);
        toast.success('Added');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (item) => {
    setForm({ highSchoolName: item.highSchoolName, postalCode: item.postalCode, cityName: item.cityName, provinceName: item.provinceName });
    setEditId(item._id); setShowForm(true);
  };

  return (
    <div>
      <div style={s.header}>
        <h3 style={{ color: '#ddd', margin: 0 }}>High Schools</h3>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add</button>
      </div>
      <table style={s.table}>
        <thead><tr>{['Name','City','Province','Postal Code',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i._id} style={s.tr}>
              <td style={s.td}>{i.highSchoolName}</td>
              <td style={s.td}>{i.cityName}</td>
              <td style={s.td}>{i.provinceName}</td>
              <td style={s.td}>{i.postalCode}</td>
              <td style={s.td}><button onClick={() => openEdit(i)} style={s.smBtn}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, color:'#e94560' }}>{editId ? 'Edit High School' : 'Add High School'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', color:'#888', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['highSchoolName','School Name',true],['streetAddress','City',false],['cityName','City',true],['provinceName','Province',true],['postalCode','Postal Code',true]].map(([key,label,req]) => (
                key === 'streetAddress' ? null :
                <div key={key}>
                  <label style={s.label}>{label}{req?' *':''}</label>
                  <input value={form[key]||''} onChange={e => setForm({...form,[key]:e.target.value})} style={s.input} required={!!req} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.btn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProvincialOrgs() {
  const [items, setItems]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [name, setName]         = useState('');

  useEffect(() => { api.get('/provincial-orgs').then(r => setItems(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/provincial-orgs/${editId}`, { organizationName: name });
        setItems(prev => prev.map(i => i._id === editId ? data : i));
        toast.success('Updated');
      } else {
        const { data } = await api.post('/provincial-orgs', { organizationName: name });
        setItems(prev => [...prev, data]);
        toast.success('Added');
      }
      setShowForm(false); setName(''); setEditId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={s.header}>
        <h3 style={{ color: '#ddd', margin: 0 }}>Provincial Organizations</h3>
        <button onClick={() => { setName(''); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add</button>
      </div>
      <table style={s.table}>
        <thead><tr>{['Organization Name',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i._id} style={s.tr}>
              <td style={s.td}>{i.organizationName}</td>
              <td style={s.td}><button onClick={() => { setName(i.organizationName); setEditId(i._id); setShowForm(true); }} style={s.smBtn}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, color:'#e94560' }}>{editId ? 'Edit Organization' : 'Add Organization'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', color:'#888', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={s.label}>Organization Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} style={s.input} required />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
                <button type="submit" style={s.btn}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
