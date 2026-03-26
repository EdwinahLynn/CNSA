const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Hardcoded users for testing (no DB required)
const MOCK_USERS = [
  { _id: 'mock-admin-001', username: 'admin',        passwordHash: 'admin123',  role: 'CNSA_ADMIN',   isActive: true, schoolId: null },
  { _id: 'mock-school-001', username: 'schooladmin', passwordHash: 'school123', role: 'SCHOOL_ADMIN', isActive: true, schoolId: null },
  { _id: 'mock-coach-001',  username: 'coach',       passwordHash: 'coach123',  role: 'COACH',        isActive: true, schoolId: null },
];

// POST /api/auth/login
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  // Try mock users first (works without DB)
  const mockUser = MOCK_USERS.find(u => u.username === username && u.passwordHash === password);
  if (mockUser) {
    const { passwordHash, ...safeUser } = mockUser;
    return res.json({ token: signToken(mockUser._id), user: safeUser });
  }

  // Fall back to DB if available
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
    res.json({ token: signToken(user._id), user });
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const mockUser = MOCK_USERS.find(u => u._id === decoded.id);
    if (mockUser) {
      const { passwordHash, ...safeUser } = mockUser;
      return res.json(safeUser);
    }
  } catch {}
  // Fall back to DB
  const { protect: protectMw } = require('../middleware/auth');
  protectMw(req, res, () => res.json(req.user));
});

// POST /api/auth/register  (CNSA_ADMIN only)
router.post('/register', protect, authorize('CNSA_ADMIN'), [
  body('username').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password, role, schoolId } = req.body;
  if (await User.findOne({ username })) {
    return res.status(409).json({ message: 'Username already taken' });
  }
  const user = await User.create({ username, passwordHash: password, role, schoolId: schoolId || null });
  res.status(201).json(user);
});

// PATCH /api/auth/users/:id/deactivate  (CNSA_ADMIN only)
router.patch('/users/:id/deactivate', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// GET /api/auth/users  (CNSA_ADMIN only)
router.get('/users', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const users = await User.find().populate('schoolId', 'schoolName');
  res.json(users);
});

module.exports = router;
