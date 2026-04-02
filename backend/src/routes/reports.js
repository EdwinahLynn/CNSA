const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// GET /api/reports/audit
router.get('/audit', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 500 al.AuditID, al.ActionType, al.AffectedEntity, al.AffectedID,
           al.Details, al.Timestamp, u.Username, u.Role
    FROM AuditLog al
    JOIN Users u ON al.UserID = u.UserID
    ORDER BY al.Timestamp DESC
  `);
  res.json(result.recordset);
});

// GET /api/reports/players-by-school
router.get('/players-by-school', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT s.SchoolName, COUNT(*) AS Total,
           SUM(CASE WHEN p.Status = 'Active' THEN 1 ELSE 0 END) AS Active
    FROM Player p
    JOIN School s ON p.SchoolID = s.SchoolID
    GROUP BY s.SchoolID, s.SchoolName
    ORDER BY Total DESC
  `);
  res.json(result.recordset);
});

// GET /api/reports/injuries-summary
router.get('/injuries-summary', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = `
    SELECT i.InjuryStatus AS _id, COUNT(*) AS count
    FROM Injury i
    JOIN Player p ON i.PlayerID = p.PlayerID
  `;
  if (req.user.Role === 'COACH') {
    query += ' WHERE p.CoachID = @coachId';
    request.input('coachId', sql.Int, req.user.CoachID);
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE p.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  query += ' GROUP BY i.InjuryStatus';
  res.json((await request.query(query)).recordset);
});

// GET /api/reports/my-players (COACH only)
router.get('/my-players', protect, authorize('COACH'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('coachId', sql.Int, req.user.CoachID)
    .query(`
      SELECT p.PlayerID AS _id, p.FirstName, p.LastName, p.Status, p.HighSchool,
             s.SchoolName,
             (SELECT STRING_AGG(pos.PositionName, ', ')
              FROM PlayerPosition pp JOIN Position pos ON pp.PositionID = pos.PositionID
              WHERE pp.PlayerID = p.PlayerID) AS Positions,
             (SELECT COUNT(*) FROM Injury i WHERE i.PlayerID = p.PlayerID) AS InjuryCount,
             (SELECT COUNT(*) FROM RecruitingIncident ri WHERE ri.PlayerID = p.PlayerID) AS IncidentCount
      FROM Player p
      JOIN School s ON p.SchoolID = s.SchoolID
      WHERE p.CoachID = @coachId
      ORDER BY p.LastName, p.FirstName
    `);
  res.json(result.recordset);
});

// GET /api/reports/top-scorers
router.get('/top-scorers', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 20 p.PlayerID AS _id, p.FirstName, p.LastName,
           SUM(gs.Goals)   AS totalGoals,
           SUM(gs.Assists) AS totalAssists
    FROM GameStats gs
    JOIN Player p ON gs.PlayerID = p.PlayerID
    GROUP BY p.PlayerID, p.FirstName, p.LastName
    ORDER BY totalGoals DESC
  `);
  res.json(result.recordset);
});

module.exports = router;
