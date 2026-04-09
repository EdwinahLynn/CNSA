const { getPool } = require('../config/db');

const auditAction = (actionType, affectedEntity) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.UserID) {
      if (isNaN(req.user.UserID)) return;
      try {
        const pool = await getPool();
        await pool.query(
          `INSERT INTO auditlog (userid, actiontype, affectedentity, affectedid, details)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.UserID, actionType, affectedEntity, req.params.id || null, `${req.method} ${req.path}`]
        );
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
  });
  next();
};

module.exports = { auditAction };
