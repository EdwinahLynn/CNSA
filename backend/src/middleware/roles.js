// authorize(...roles) — pass allowed role strings
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Role '${req.user.role}' is not permitted` });
  }
  next();
};

// Ensure school-scoped users only touch their own school's data
// Expects req.params.schoolId or req.body.schoolId
const ownSchool = (req, res, next) => {
  if (req.user.role === 'CNSA_ADMIN') return next();
  const target = req.params.schoolId || req.body.schoolId;
  if (!target || target.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Access restricted to your own school' });
  }
  next();
};

module.exports = { authorize, ownSchool };
