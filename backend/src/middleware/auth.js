const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const MOCK_USERS = [
  { UserID: 'mock-admin-001',  Username: 'admin',       Role: 'CNSA_ADMIN',   IsActive: true, SchoolID: null },
  { UserID: 'mock-school-001', Username: 'schooladmin', Role: 'SCHOOL_ADMIN', IsActive: true, SchoolID: null },
  { UserID: 'mock-coach-001',  Username: 'coach',       Role: 'COACH',        IsActive: true, SchoolID: null },
];

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check mock users first (no DB needed)
    const mock = MOCK_USERS.find(u => u.UserID === decoded.id);
    if (mock) {
      req.user = mock;
      return next();
    }

    // Fall back to SQL Server
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query(`SELECT UserID, Username, Role, SchoolID, IsActive, CoachID FROM Users WHERE UserID = @id`);

    const user = result.recordset[0];
    if (!user || !user.IsActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
