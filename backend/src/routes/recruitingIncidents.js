const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const select = `
  SELECT ri.incidentid AS "_id", ri.incidentid AS "IncidentID", ri.playerid AS "PlayerID",
         ri.description AS "Description", ri.incidentdate AS "IncidentDate",
         p.firstname AS "FirstName", p.lastname AS "LastName"
  FROM recruitingincidents ri JOIN players p ON ri.playerid=p.playerid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role === 'COACH') return res.json((await pool.query(select + ' WHERE p.coachid=$1', [req.user.CoachID])).rows);
  if (req.user.Role !== 'CNSA_ADMIN') return res.json((await pool.query(select + ' WHERE p.schoolid=$1', [req.user.SchoolID])).rows);
  res.json((await pool.query(select)).rows);
});

router.get('/player/:playerId', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.query(select + ' WHERE ri.playerid=$1 ORDER BY ri.incidentdate DESC', [req.params.playerId])).rows);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'RecruitingIncident'), async (req, res) => {
  const { playerId, description, incidentDate } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO recruitingincidents (playerid, description, incidentdate) VALUES ($1,$2,$3) RETURNING incidentid`,
    [playerId, description, incidentDate]
  );
  const full = await pool.query(select + ' WHERE ri.incidentid=$1', [result.rows[0].incidentid]);
  res.status(201).json(full.rows[0]);
});

router.delete('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.query('DELETE FROM recruitingincidents WHERE incidentid=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
