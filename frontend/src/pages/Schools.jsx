import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { s } from '../styles/shared.js';

const EMPTY = { schoolName: '', schoolPopulation: '', streetAddress: '', postalCode: '', cityName: '', provinceName: '' };

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  useEffect(() => { api.get('/schools').then(r => setSchools(r.data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/schools/${editId}`, form);
        setSchools(prev => prev.map(s => s._id === editId ? data : s));
        toast.success('School updated');
      } else {
        const { data } = await api.post('/schools', form);
        setSchools(prev => [...prev, data]);
        toast.success('School added');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (s) => {
    setForm({ schoolName: s.schoolName, schoolPopulation: s.schoolPopulation || '', streetAddress: s.streetAddress, postalCode: s.postalCode, cityName: s.cityName, provinceName: s.provinceName });
    setEditId(s._id); setShowForm(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Schools</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add School</button>
      </div>
      <div style={s.grid}>
        {schools.map(sc => (
          <div key={sc._id} style={s.card}>
            <h3 style={s.cardTitle}>{sc.schoolName}</h3>
            <p style={s.cardMeta}>{sc.cityName}, {sc.provinceName}</p>
            <p style={s.cardMeta}>{sc.streetAddress} · {sc.postalCode}</p>
            {sc.schoolPopulation && <p style={s.cardMeta}>Population: {sc.schoolPopulation.toLocaleString()}</p>}
            <button onClick={() => openEdit(sc)} style={s.smBtn}>Edit</button>
          </div>
        ))}
      </div>

      {showForm && (
        <Overlay onClose={() => setShowForm(false)} title={editId ? 'Edit School' : 'Add School'}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[['schoolName','School Name',true],['streetAddress','Street Address',true],['cityName','City',true],['provinceName','Province',true],['postalCode','Postal Code',true],['schoolPopulation','Population']].map(([key, label, req]) => (
              <div key={key}>
                <label style={s.label}>{label}{req?' *':''}</label>
                <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={s.input} required={!!req} />
              </div>
            ))}
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
