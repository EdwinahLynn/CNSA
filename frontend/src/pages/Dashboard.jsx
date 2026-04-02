import { useAuth } from '../context/AuthContext';

const roleDescriptions = {
  CNSA_ADMIN:   'Full access to all data, users, schools, and reports.',
  SCHOOL_ADMIN: 'Manage your school\'s players, coaches, teams, games, and scholarships.',
  COACH:        'View and manage your recruited players, log injuries, and generate reports.'
};

const rolePermissions = {
  CNSA_ADMIN:   ['Manage all schools and users', 'View all players across schools', 'Generate system-wide reports', 'Configure stadiums and settings'],
  SCHOOL_ADMIN: ['Manage players at your school', 'Assign coaches to players', 'Track injuries and scholarships', 'View school reports'],
  COACH:        ['View your recruited players', 'Record recruiting incidents', 'Track player rankings', 'Manage player profiles'],
};

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <div style={styles.layout}>

        {/* Left: Info Panel */}
        <div style={styles.infoPanel}>
          <div style={styles.avatarCircle}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <h2 style={styles.username}>{user?.username}</h2>
          <span style={styles.roleBadge}>{user?.role?.replace('_', ' ')}</span>

          {user?.schoolName && (
            <div style={styles.infoBlock}>
              <span style={styles.infoLabel}>School</span>
              <span style={styles.infoValue}>{user.schoolName}</span>
            </div>
          )}

          <div style={styles.infoBlock}>
            <span style={styles.infoLabel}>Access Level</span>
            <span style={styles.infoValue}>
              {user?.role === 'CNSA_ADMIN' ? 'National Admin' : user?.role === 'SCHOOL_ADMIN' ? 'School Admin' : 'Coach'}
            </span>
          </div>

          <div style={styles.divider} />

          <p style={styles.permTitle}>Your Permissions</p>
          <ul style={styles.permList}>
            {(rolePermissions[user?.role] || []).map(p => (
              <li key={p} style={styles.permItem}>
                <span style={styles.bullet}>✓</span> {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Nav Cards */}
        <div style={styles.right}>
          <h3 style={styles.navTitle}>Quick Navigation</h3>
          <p style={styles.navDesc}>{roleDescriptions[user?.role]}</p>
          <div style={styles.grid}>
            {cards.filter(c => c.roles.includes(user?.role)).map(c => (
              <a key={c.label} href={c.href} style={styles.card}>
                <span style={styles.icon}>{c.icon}</span>
                <span style={styles.cardLabel}>{c.label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const cards = [
  { label: 'Players',      href: '/players',      icon: '⚽', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Coaches',      href: '/coaches',      icon: '🧑‍💼', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Teams',        href: '/teams',        icon: '🏆', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Games',        href: '/games',        icon: '📅', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Injuries',     href: '/injuries',     icon: '🩹', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Scholarships', href: '/scholarships', icon: '🎓', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN'] },
  { label: 'Schools',      href: '/schools',      icon: '🏫', roles: ['CNSA_ADMIN'] },
  { label: 'Stadiums',     href: '/stadiums',     icon: '🏟️', roles: ['CNSA_ADMIN'] },
  { label: 'Summaries',    href: '/reports',      icon: '📊', roles: ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'] },
  { label: 'Users',        href: '/users',        icon: '👥', roles: ['CNSA_ADMIN'] },
];

const styles = {
  page:        { padding: '2rem' },
  layout:      { display: 'flex', gap: '2rem', alignItems: 'flex-start' },

  infoPanel:   { background: '#1a1a2e', borderRadius: '14px', padding: '2rem 1.5rem', minWidth: '240px', maxWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  avatarCircle:{ width: '72px', height: '72px', borderRadius: '50%', background: '#e94560', color: '#fff', fontSize: '2rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' },
  username:    { color: '#fff', margin: '0 0 0.5rem', fontSize: '1.2rem' },
  roleBadge:   { background: '#e94560', color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' },

  infoBlock:   { width: '100%', marginBottom: '0.75rem', textAlign: 'left' },
  infoLabel:   { display: 'block', color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' },
  infoValue:   { color: '#ccc', fontSize: '0.9rem' },

  divider:     { width: '100%', borderTop: '1px solid #333', margin: '1rem 0' },
  permTitle:   { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem', alignSelf: 'flex-start' },
  permList:    { listStyle: 'none', padding: 0, margin: 0, width: '100%', textAlign: 'left' },
  permItem:    { color: '#aaa', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'flex', gap: '0.4rem' },
  bullet:      { color: '#27ae60', fontWeight: '700', flexShrink: 0 },

  right:       { flex: 1 },
  navTitle:    { color: '#e94560', margin: '0 0 0.25rem' },
  navDesc:     { color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' },
  card:        { background: '#1a1a2e', borderRadius: '14px', padding: '2.5rem 1.5rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer' },
  icon:        { fontSize: '2.75rem' },
  cardLabel:   { color: '#ddd', fontWeight: '600', fontSize: '1.05rem' },
};
