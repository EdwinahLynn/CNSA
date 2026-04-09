const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');
const { protect }  = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const normalizeUser = (u) => ({
  _id:      u.userid,
  username: u.username,
  role:     u.role,
  schoolId: u.schoolid,
  coachId:  u.coachid || null,
  isActive: u.isactive
});

const MOCK_USERS = [
  { userid: 'mock-admin-001',  username: 'admin',       password: 'admin123',  role: 'CNSA_ADMIN',   isactive: true, schoolid: null },
  { userid: 'mock-school-001', username: 'schooladmin', password: 'school123', role: 'SCHOOL_ADMIN', isactive: true, schoolid: null },
  { userid: 'mock-coach-001',  username: 'coach',       password: 'coach123',  role: 'COACH',        isactive: true, schoolid: null },
];

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  const mock = MOCK_USERS.find(u => u.username === username && u.password === password);
  if (mock) {
    return res.json({ token: signToken(mock.userid), user: normalizeUser(mock) });
  }

  try {
    const pool = await getPool();
    const result = await pool.query(
      `SELECT userid, username, passwordhash, role, schoolid, isactive, coachid
       FROM users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isactive) return res.status(403).json({ message: 'Account deactivated' });

    const match = await bcrypt.compare(password, user.passwordhash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user.userid), user: normalizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const mock = MOCK_USERS.find(u => u.userid === decoded.id);
    if (mock) return res.json(normalizeUser(mock));
  } catch {}
  protect(req, res, () => res.json(req.user));
});

// POST /api/auth/register (CNSA_ADMIN only)
router.post('/register', protect, authorize('CNSA_ADMIN'), [
  body('username').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, role, schoolId, coachId } = req.body;
  const pool = await getPool();

  const existing = await pool.query('SELECT userid FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) return res.status(409).json({ message: 'Username already taken' });

  if (coachId) {
    const coachCheck = await pool.query(
      'SELECT coachid FROM coachs WHERE coachid = $1 AND schoolid = $2',
      [coachId, schoolId || null]
    );
    if (!coachCheck.rows[0]) return res.status(400).json({ message: 'Coach does not belong to the selected school' });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (username, passwordhash, role, schoolid, coachid)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING userid, username, role, schoolid, coachid, isactive`,
    [username, hash, role, schoolId || null, coachId || null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/auth/users/:id (CNSA_ADMIN only)
router.put('/users/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { username, password, role, schoolId, coachId } = req.body;
  if (!username || !role) return res.status(400).json({ message: 'Username and role are required' });

  const pool = await getPool();

  const existing = await pool.query(
    'SELECT userid FROM users WHERE username = $1 AND userid <> $2',
    [username, req.params.id]
  );
  if (existing.rows.length > 0) return res.status(409).json({ message: 'Username already taken' });

  if (coachId) {
    const coachCheck = await pool.query(
      'SELECT coachid FROM coachs WHERE coachid = $1 AND schoolid = $2',
      [coachId, schoolId || null]
    );
    if (!coachCheck.rows[0]) return res.status(400).json({ message: 'Coach does not belong to the selected school' });
  }

  if (password && password.length >= 6) {
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE users SET username=$1, passwordhash=$2, role=$3, schoolid=$4, coachid=$5 WHERE userid=$6',
      [username, hash, role, schoolId || null, coachId || null, req.params.id]
    );
  } else {
    await pool.query(
      'UPDATE users SET username=$1, role=$2, schoolid=$3, coachid=$4 WHERE userid=$5',
      [username, role, schoolId || null, coachId || null, req.params.id]
    );
  }

  const updated = await pool.query(
    `SELECT u.userid AS "_id", u.userid AS "UserID", u.username AS "Username", u.role AS "Role",
            u.isactive AS "IsActive", u.schoolid AS "SchoolID", u.coachid AS "CoachID", s.schoolname AS "SchoolName"
     FROM users u LEFT JOIN school s ON u.schoolid = s.schoolid WHERE u.userid = $1`,
    [req.params.id]
  );
  res.json(updated.rows[0]);
});

// PATCH /api/auth/users/:id/deactivate
router.patch('/users/:id/deactivate', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.query('UPDATE users SET isactive = false WHERE userid = $1', [req.params.id]);
  res.json({ message: 'User deactivated' });
});

// PATCH /api/auth/users/:id/activate
router.patch('/users/:id/activate', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.query('UPDATE users SET isactive = true WHERE userid = $1', [req.params.id]);
  res.json({ message: 'User activated' });
});

// GET /api/auth/users
router.get('/users', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT u.userid AS "_id", u.userid AS "UserID", u.username AS "Username", u.role AS "Role",
            u.isactive AS "IsActive", u.schoolid AS "SchoolID", u.coachid AS "CoachID", s.schoolname AS "SchoolName"
     FROM users u LEFT JOIN school s ON u.schoolid = s.schoolid`
  );
  res.json(result.rows);
});

module.exports = router;
