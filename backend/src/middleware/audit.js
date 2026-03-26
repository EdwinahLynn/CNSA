const AuditLog = require('../models/AuditLog');

// Usage: auditAction('CREATE', 'Player')
const auditAction = (actionType, affectedEntity) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await AuditLog.create({
          userId: req.user._id,
          actionType,
          affectedEntity,
          affectedId: req.params.id || res.locals.affectedId || null,
          details: { method: req.method, path: req.path }
        });
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
  });
  next();
};

module.exports = { auditAction };
