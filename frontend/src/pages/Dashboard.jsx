
import { useAuth } from '../context/AuthContext';

const roleDescriptions = {
  CNSA_ADMIN:   'Full access to all data, users, schools, and reports.',
  SCHOOL_ADMIN: 'Manage your school\'s players, coaches, teams, games, and scholarships.',
  COACH:        'View and add players and injury reports for your team.'
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Welcome, {user?.username}</h2>
      <p style={styles.desc}>{roleDescriptions[user?.role]}</p>
      <div style={styles.grid}>
        {cards.filter(c => c.roles.includes(user?.role)).map(c => (
          <a key={c.label} href={c.href} style={styles.card}>
            <span style={styles.icon}>{c.icon}</span>
            <span style={styles.cardLabel}>{c.label}</span>
          </a>
        ))}
      </div>
    </div>






  );
}

const cards = [
  { label: 'Players',      href: '/players',      icon: '⚽', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Coaches',      href: '/coaches',      icon: '🧑‍💼', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Teams',        href: '/teams',        icon: '🏆', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Games',        href: '/games',        icon: '📅', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Injuries',     href: '/injuries',     icon: '🩹', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Scholarships', href: '/scholarships', icon: '🎓', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Schools',      href: '/schools',      icon: '🏫', roles: ['CNSA_ADMIN'] },
  { label: 'Stadiums',     href: '/stadiums',     icon: '🏟️', roles: ['CNSA_ADMIN'] },
  { label: 'Reports',      href: '/reports',      icon: '📊', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Users',        href: '/users',        icon: '👥', roles: ['CNSA_ADMIN'] },
];

const styles = {
  page:      { padding: '2rem' },
  title:     { color: '#e94560', marginBottom: '0.5rem' },
  desc:      { color: '#888', marginBottom: '2rem' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' },
  card:      { background: '#1a1a2e', borderRadius: '10px', padding: '1.5rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', transition: 'transform 0.15s', cursor: 'pointer' },
  icon:      { fontSize: '2rem' },
  cardLabel: { color: '#ddd', fontWeight: '500', fontSize: '0.95rem' }
};
