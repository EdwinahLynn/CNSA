const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const MOCK_USERS = [
  { UserID: 'mock-admin-001',  Username: 'admin',       Role: 'CNSA_ADMIN',   IsActive: true, SchoolID: null, CoachID: null },
  { UserID: 'mock-school-001', Username: 'schooladmin', Role: 'SCHOOL_ADMIN', IsActive: true, SchoolID: null, CoachID: null },
  { UserID: 'mock-coach-001',  Username: 'coach',       Role: 'COACH',        IsActive: true, SchoolID: null, CoachID: null },
];

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const mock = MOCK_USERS.find(u => u.UserID === decoded.id);
    if (mock) {
      req.user = mock;
      return next();
    }

    const pool = await getPool();
    const result = await pool.query(
      'SELECT userid, username, role, schoolid, isactive, coachid FROM users WHERE userid = $1',
      [decoded.id]
    );

    const u = result.rows[0];
    if (!u || !u.isactive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }

    // Normalize to PascalCase so all routes work unchanged
    req.user = {
      UserID:   u.userid,
      Username: u.username,
      Role:     u.role,
      SchoolID: u.schoolid,
      IsActive: u.isactive,
      CoachID:  u.coachid || null,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
