const { getPool, sql } = require('../config/db');

const auditAction = (actionType, affectedEntity) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.UserID) {
      // Skip mock users (non-integer IDs)
      if (isNaN(req.user.UserID)) return;
      try {
        const pool = await getPool();
        await pool.request()
          .input('userId',          sql.Int,          req.user.UserID)
          .input('actionType',      sql.VarChar(100), actionType)
          .input('affectedEntity',  sql.VarChar(100), affectedEntity)
          .input('affectedId',      sql.VarChar(50),  req.params.id || null)
          .input('details',         sql.VarChar(500), `${req.method} ${req.path}`)
          .query(`INSERT INTO AuditLog (UserID, ActionType, AffectedEntity, AffectedID, Details)
                  VALUES (@userId, @actionType, @affectedEntity, @affectedId, @details)`);
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
  });
  next();
};

module.exports = { auditAction };
