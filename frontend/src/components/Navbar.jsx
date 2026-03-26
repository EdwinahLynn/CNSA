import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard',    label: 'Dashboard',    roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { to: '/players',      label: 'Players',      roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { to: '/coaches',      label: 'Coaches',      roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { to: '/teams',        label: 'Teams',        roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { to: '/games',        label: 'Games',        roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { to: '/injuries',     label: 'Injuries',     roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { to: '/scholarships', label: 'Scholarships', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { to: '/schools',      label: 'Schools',      roles: ['CNSA_ADMIN'] },
  { to: '/stadiums',     label: 'Stadiums',     roles: ['CNSA_ADMIN'] },
  { to: '/reports',      label: 'Reports',      roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { to: '/users',        label: 'Users',        roles: ['CNSA_ADMIN'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>CNSA</span>
      <div style={styles.links}>
        {navLinks
          .filter(l => user && l.roles.includes(user.role))
          .map(l => <Link key={l.to} to={l.to} style={styles.link}>{l.label}</Link>)
        }
      </div>
      <div style={styles.user}>
        <span style={styles.roleTag}>{user?.role}</span>
        <span style={{ color: '#ccc' }}>{user?.username}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav:       { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: '#1a1a2e', color: '#fff', flexWrap: 'wrap' },
  brand:     { fontWeight: 'bold', fontSize: '1.2rem', color: '#e94560', marginRight: '1rem' },
  links:     { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 },
  link:      { color: '#ddd', textDecoration: 'none', fontSize: '0.9rem' },
  user:      { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  roleTag:   { background: '#e94560', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' },
  logoutBtn: { background: 'transparent', border: '1px solid #e94560', color: '#e94560', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }
};
