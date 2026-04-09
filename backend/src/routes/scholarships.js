const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const scholarshipSelect = `
  SELECT sc.scholarshipid AS "_id", sc.scholarshipid AS "ScholarshipID",
         sc.scholarshipname AS "ScholarshipName", sc.scholarshipamount AS "ScholarshipAmount",
         sc.dateawarded AS "DateAwarded",
         sc.playerid AS "PlayerID", p.firstname AS "FirstName", p.lastname AS "LastName",
         p.schoolid AS "SchoolID", s.schoolname AS "SchoolName"
  FROM scholarship sc
  JOIN players p ON sc.playerid = p.playerid
  JOIN schools s ON p.schoolid  = s.schoolid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(scholarshipSelect + ' WHERE p.schoolid=$1', [req.user.SchoolID])).rows);
  }
  res.json((await pool.query(scholarshipSelect)).rows);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Scholarship'), async (req, res) => {
  const { playerId, scholarshipName, scholarshipAmount, dateAwarded } = req.body;
  const pool = await getPool();
  if (req.user.Role !== 'CNSA_ADMIN') {
    const check = await pool.query('SELECT schoolid FROM players WHERE playerid=$1', [playerId]);
    if (!check.rows[0] || check.rows[0].schoolid !== req.user.SchoolID) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }
  const result = await pool.query(
    `INSERT INTO scholarship (playerid, scholarshipname, scholarshipamount, dateawarded)
     VALUES ($1,$2,$3,$4) RETURNING scholarshipid`,
    [playerId, scholarshipName, scholarshipAmount||null, dateAwarded]
  );
  const full = await pool.query(scholarshipSelect + ' WHERE sc.scholarshipid=$1', [result.rows[0].scholarshipid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Scholarship'), async (req, res) => {
  const { scholarshipName, scholarshipAmount, dateAwarded } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE scholarship SET scholarshipname=$1, scholarshipamount=$2, dateawarded=$3 WHERE scholarshipid=$4`,
    [scholarshipName, scholarshipAmount||null, dateAwarded, req.params.id]
  );
  const full = await pool.query(scholarshipSelect + ' WHERE sc.scholarshipid=$1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
