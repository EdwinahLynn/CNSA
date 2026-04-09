const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const teamSelect = `
  SELECT t.teamid AS "_id", t.teamid AS "TeamID", t.season AS "Season", t.gender AS "Gender",
         t.schoolid AS "SchoolID", s.schoolname AS "SchoolName",
         t.coachid AS "CoachID", c.firstname AS "CoachFirstName", c.lastname AS "CoachLastName"
  FROM teams t
  JOIN schools s ON t.schoolid = s.schoolid
  JOIN coachs  c ON t.coachid  = c.coachid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(teamSelect + ' WHERE t.schoolid = $1', [req.user.SchoolID])).rows);
  }
  res.json((await pool.query(teamSelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(teamSelect + ' WHERE t.teamid = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Team not found' });
  res.json(result.rows[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Team'), async (req, res) => {
  const { schoolId, coachId, season, gender } = req.body;
  if (req.user.Role !== 'CNSA_ADMIN' && Number(schoolId) !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Can only create teams for your own school' });
  }
  const pool = await getPool();
  const dup = await pool.query(
    'SELECT teamid FROM teams WHERE schoolid=$1 AND season=$2 AND gender=$3',
    [schoolId, season, gender]
  );
  if (dup.rows.length > 0) return res.status(409).json({ message: 'A team for this school, season, and gender already exists' });
  const coachCheck = await pool.query('SELECT coachid FROM coachs WHERE coachid=$1 AND schoolid=$2', [coachId, schoolId]);
  if (!coachCheck.rows[0]) return res.status(400).json({ message: 'Coach does not belong to this school' });
  const result = await pool.query(
    `INSERT INTO teams (schoolid, coachid, season, gender) VALUES ($1,$2,$3,$4) RETURNING teamid`,
    [schoolId, coachId, season, gender]
  );
  const full = await pool.query(teamSelect + ' WHERE t.teamid = $1', [result.rows[0].teamid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Team'), async (req, res) => {
  const { schoolId, coachId, season, gender } = req.body;
  const pool = await getPool();
  const coachCheck = await pool.query('SELECT coachid FROM coachs WHERE coachid=$1 AND schoolid=$2', [coachId, schoolId]);
  if (!coachCheck.rows[0]) return res.status(400).json({ message: 'Coach does not belong to this school' });
  await pool.query(
    'UPDATE teams SET schoolid=$1, coachid=$2, season=$3, gender=$4 WHERE teamid=$5',
    [schoolId, coachId, season, gender, req.params.id]
  );
  const full = await pool.query(teamSelect + ' WHERE t.teamid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
