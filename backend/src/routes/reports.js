const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/audit', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT al.auditid AS "_id", al.actiontype AS "ActionType", al.affectedentity AS "AffectedEntity",
           al.affectedid AS "AffectedID", al.details AS "Details", al.timestamp AS "Timestamp",
           u.username AS "Username", u.role AS "Role"
    FROM auditlog al JOIN users u ON al.userid = u.userid
    ORDER BY al.timestamp DESC LIMIT 500
  `);
  res.json(result.rows);
});

router.get('/players-by-school', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT s.schoolid AS "_id", s.schoolname AS "SchoolName",
           COUNT(*) AS "Total",
           SUM(CASE WHEN p.status='Active' THEN 1 ELSE 0 END) AS "Active"
    FROM players p JOIN schools s ON p.schoolid=s.schoolid
    GROUP BY s.schoolid, s.schoolname ORDER BY "Total" DESC
  `);
  res.json(result.rows);
});

router.get('/injuries-summary', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), async (req, res) => {
  const pool = await getPool();
  let query = `SELECT i.injurystatus AS "_id", COUNT(*) AS "count" FROM injuries i JOIN players p ON i.playerid=p.playerid`;
  const params = [];
  if (req.user.Role === 'COACH') { query += ' WHERE p.coachid=$1'; params.push(req.user.CoachID); }
  else if (req.user.Role !== 'CNSA_ADMIN') { query += ' WHERE p.schoolid=$1'; params.push(req.user.SchoolID); }
  query += ' GROUP BY i.injurystatus';
  res.json((await pool.query(query, params)).rows);
});

router.get('/my-players', protect, authorize('COACH'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT p.playerid AS "_id", p.firstname AS "FirstName", p.lastname AS "LastName",
           p.status AS "Status", p.highschool AS "HighSchool", s.schoolname AS "SchoolName",
           (SELECT STRING_AGG(pos.positionname, ', ')
            FROM playerposition pp JOIN positions pos ON pp.positionid=pos.positionid
            WHERE pp.playerid=p.playerid) AS "Positions",
           (SELECT COUNT(*) FROM injuries i WHERE i.playerid=p.playerid)::int AS "InjuryCount",
           (SELECT COUNT(*) FROM recruitingincidents ri WHERE ri.playerid=p.playerid)::int AS "IncidentCount"
    FROM players p JOIN schools s ON p.schoolid=s.schoolid
    WHERE p.coachid=$1 ORDER BY p.lastname, p.firstname
  `, [req.user.CoachID]);
  res.json(result.rows);
});

router.get('/top-scorers', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT p.playerid AS "_id", p.firstname AS "FirstName", p.lastname AS "LastName",
           SUM(gs.goals) AS "TotalGoals", SUM(gs.assists) AS "TotalAssists"
    FROM gamestats gs JOIN players p ON gs.playerid=p.playerid
    GROUP BY p.playerid, p.firstname, p.lastname
    ORDER BY "TotalGoals" DESC LIMIT 20
  `);
  res.json(result.rows);
});

module.exports = router;
