import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { s } from '../styles/shared.js';

const EMPTY = { firstName: '', lastName: '', sex: 'M', phoneNumber: '', email: '',
  streetAddress: '', postalCode: '', cityName: '', provinceName: '', schoolId: '', previousSchools: [] };

export default function Coaches() {
  const { user } = useAuth();
  const [coaches, setCoaches]   = useState([]);
  const [schools, setSchools]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    api.get('/coaches').then(r => setCoaches(r.data));
    api.get('/schools').then(r => setSchools(r.data));
  }, []);

  const canWrite = ['CNSA_ADMIN', 'SCHOOL_ADMIN'].includes(user?.role);

  const openEdit = (c) => {
    setForm({ firstName: c.firstName, lastName: c.lastName, sex: c.sex, phoneNumber: c.phoneNumber||'', email: c.email||'', streetAddress: c.streetAddress, postalCode: c.postalCode, cityName: c.cityName, provinceName: c.provinceName, schoolId: c.schoolId, previousSchools: c.previousSchools||[] });
    setEditId(c._id); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/coaches/${editId}`, form);
        setCoaches(prev => prev.map(c => c._id === editId ? data : c));
        toast.success('Coach updated');
      } else {
        const { data } = await api.post('/coaches', form);
        setCoaches(prev => [...prev, data]);
        toast.success('Coach added');
      }
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Coaches</h2>
        {canWrite && <button onClick={() => { setForm({ ...EMPTY, schoolId: user.schoolId||'' }); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add Coach</button>}
      </div>

      <table style={s.table}>
        <thead><tr>{['Name','School','Email','Phone',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {coaches.map(c => (
            <tr key={c._id} style={s.tr}>
              <td style={s.td}>{c.firstName} {c.lastName}</td>
              <td style={s.td}>{c.schoolName || '—'}</td>
              <td style={s.td}>{c.email || '—'}</td>
              <td style={s.td}>{c.phoneNumber || '—'}</td>
              <td style={s.td}>{canWrite && <button onClick={() => openEdit(c)} style={s.smBtn}>Edit</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Overlay title={editId ? 'Edit Coach' : 'Add Coach'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {[['firstName','First Name',true],['lastName','Last Name',true],['email','Email'],['phoneNumber','Phone'],['streetAddress','Street Address',true],['cityName','City',true],['provinceName','Province',true],['postalCode','Postal Code',true]].map(([key,label,req]) => (
              <div key={key}>
                <label style={s.label}>{label}{req?' *':''}</label>
                <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={s.input} required={!!req} />
              </div>
            ))}
            <div>
              <label style={s.label}>Sex *</label>
              <select value={form.sex} onChange={e => setForm({...form,sex:e.target.value})} style={s.input}>
                <option value="M">Male</option><option value="F">Female</option><option value="O">Other</option>
              </select>
            </div>
            <div>
              <label style={s.label}>School *</label>
              <select value={form.schoolId} onChange={e => setForm({...form,schoolId:e.target.value})} style={s.input} required disabled={user?.role !== 'CNSA_ADMIN'}>
                <option value="">-- Select --</option>
                {schools.map(sc => <option key={sc._id} value={sc._id}>{sc.schoolName}</option>)}
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
