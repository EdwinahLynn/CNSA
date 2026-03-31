const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/db');
const { protect }  = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Normalize DB/mock PascalCase fields to camelCase for the frontend
const normalizeUser = (u) => ({
  _id:      u.UserID,
  username: u.Username,
  role:     u.Role,
  schoolId: u.SchoolID,
  coachId:  u.CoachID || null,
  isActive: u.IsActive
});

const MOCK_USERS = [
  { UserID: 'mock-admin-001',  Username: 'admin',       Password: 'admin123',  Role: 'CNSA_ADMIN',   IsActive: true, SchoolID: null },
  { UserID: 'mock-school-001', Username: 'schooladmin', Password: 'school123', Role: 'SCHOOL_ADMIN', IsActive: true, SchoolID: null },
  { UserID: 'mock-coach-001',  Username: 'coach',       Password: 'coach123',  Role: 'COACH',        IsActive: true, SchoolID: null },
];

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  // Mock users (no DB required)
  const mock = MOCK_USERS.find(u => u.Username === username && u.Password === password);
  if (mock) {
    return res.json({ token: signToken(mock.UserID), user: normalizeUser(mock) });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.VarChar(50), username)
      .query(`SELECT UserID, Username, PasswordHash, Role, SchoolID, IsActive
              FROM Users WHERE Username = @username`);

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.IsActive) return res.status(403).json({ message: 'Account deactivated' });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: signToken(user.UserID), user: normalizeUser(user) });
  } catch {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const mock = MOCK_USERS.find(u => u.UserID === decoded.id);
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

  const existing = await pool.request()
    .input('username', sql.VarChar(50), username)
    .query('SELECT UserID FROM Users WHERE Username = @username');
  if (existing.recordset.length > 0) {
    return res.status(409).json({ message: 'Username already taken' });
  }

  // If linking to a coach profile, verify that coach belongs to the given school
  if (coachId) {
    const coachCheck = await pool.request()
      .input('coachId',  sql.Int, coachId)
      .input('schoolId', sql.Int, schoolId || null)
      .query('SELECT CoachID FROM Coach WHERE CoachID=@coachId AND SchoolID=@schoolId');
    if (!coachCheck.recordset[0]) {
      return res.status(400).json({ message: 'Coach does not belong to the selected school' });
    }
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.request()
    .input('username', sql.VarChar(50),  username)
    .input('hash',     sql.VarChar(255), hash)
    .input('role',     sql.VarChar(20),  role)
    .input('schoolId', sql.Int,          schoolId || null)
    .input('coachId',  sql.Int,          coachId  || null)
    .query(`INSERT INTO Users (Username, PasswordHash, Role, SchoolID, CoachID)
            OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Role, INSERTED.SchoolID, INSERTED.CoachID, INSERTED.IsActive
            VALUES (@username, @hash, @role, @schoolId, @coachId)`);

  res.status(201).json(result.recordset[0]);
});

// PATCH /api/auth/users/:id/deactivate (CNSA_ADMIN only)
router.patch('/users/:id/deactivate', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query('UPDATE Users SET IsActive = 0 WHERE UserID = @id');
  res.json({ message: 'User deactivated' });
});

// GET /api/auth/users (CNSA_ADMIN only)
router.get('/users', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT u.UserID, u.Username, u.Role, u.IsActive, u.SchoolID, s.SchoolName
    FROM Users u
    LEFT JOIN School s ON u.SchoolID = s.SchoolID
  `);
  res.json(result.recordset);
});

module.exports = router;
