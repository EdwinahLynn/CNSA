const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MOCK_USERS = [
  { _id: 'mock-admin-001',  username: 'admin',       role: 'CNSA_ADMIN',   isActive: true, schoolId: null },
  { _id: 'mock-school-001', username: 'schooladmin', role: 'SCHOOL_ADMIN', isActive: true, schoolId: null },
  { _id: 'mock-coach-001',  username: 'coach',       role: 'COACH',        isActive: true, schoolId: null },
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
    const mockUser = MOCK_USERS.find(u => u._id === decoded.id);
    if (mockUser) {
      req.user = mockUser;
      return next();
    }

    // Fall back to DB
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ message: 'User not found or deactivated' });
    }
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
