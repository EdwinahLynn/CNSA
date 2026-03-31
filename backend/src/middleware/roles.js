const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.Role)) {
    return res.status(403).json({ message: `Role '${req.user.Role}' is not permitted` });
  }
  next();
};

const ownSchool = (req, res, next) => {
  if (req.user.Role === 'CNSA_ADMIN') return next();
  const target = req.params.schoolId || req.body.schoolId;
  if (!target || String(target) !== String(req.user.SchoolID)) {
    return res.status(403).json({ message: 'Access restricted to your own school' });
  }
  next();
};

module.exports = { authorize, ownSchool };
