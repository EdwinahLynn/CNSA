import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { s } from '../styles/shared.js';

const EMPTY = { stadiumName: '', streetAddress: '', postalCode: '', cityName: '', provinceName: '', stadiumCapacity: '', organizationId: '' };

export default function Stadiums() {
  const [stadiums, setStadiums] = useState([]);
  const [orgs, setOrgs]         = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    api.get('/stadiums').then(r => setStadiums(r.data));
    api.get('/provincial-orgs').then(r => setOrgs(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const { data } = await api.put(`/stadiums/${editId}`, form);
        setStadiums(prev => prev.map(st => st._id === editId ? data : st));
        toast.success('Stadium updated');
      } else {
        const { data } = await api.post('/stadiums', form);
        setStadiums(prev => [...prev, data]);
        toast.success('Stadium added');
      }
      setShowForm(false); setForm(EMPTY); setEditId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const openEdit = (st) => {
    setForm({ stadiumName: st.stadiumName, streetAddress: st.streetAddress, postalCode: st.postalCode, cityName: st.cityName, provinceName: st.provinceName, stadiumCapacity: st.stadiumCapacity, organizationId: st.organizationId || '' });
    setEditId(st._id); setShowForm(true);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Stadiums</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }} style={s.btn}>+ Add Stadium</button>
      </div>
      <div style={s.grid}>
        {stadiums.map(st => (
          <div key={st._id} style={s.card}>
            <h3 style={s.cardTitle}>{st.stadiumName}</h3>
            <p style={s.cardMeta}>{st.cityName}, {st.provinceName}</p>
            <p style={s.cardMeta}>{st.streetAddress}</p>
            <p style={s.cardMeta}>Capacity: {st.stadiumCapacity?.toLocaleString()}</p>
            {st.organizationName && <p style={s.cardMeta}>Org: {st.organizationName}</p>}
            <button onClick={() => openEdit(st)} style={s.smBtn}>Edit</button>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h3 style={{ margin:0, color:'#e94560' }}>{editId ? 'Edit Stadium' : 'Add Stadium'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', color:'#888', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[['stadiumName','Stadium Name',true],['streetAddress','Street Address',true],['cityName','City',true],['provinceName','Province',true],['postalCode','Postal Code',true],['stadiumCapacity','Capacity',true]].map(([key,label,req]) => (
                <div key={key}>
                  <label style={s.label}>{label}{req?' *':''}</label>
                  <input type={key==='stadiumCapacity'?'number':'text'} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={s.input} required={!!req} />
                </div>
              ))}
              <div>
                <label style={s.label}>Provincial Organization</label>
                <select value={form.organizationId} onChange={e => setForm({...form,organizationId:e.target.value})} style={s.input}>
                  <option value="">-- None --</option>
                  {orgs.map(o => <option key={o._id} value={o._id}>{o.organizationName}</option>)}
                </select>
              </div>
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
