const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const injurySelect = `
  SELECT i.injuryid AS "_id", i.injuryid AS "InjuryID", i.injurystatus AS "InjuryStatus",
         i.injurycause AS "InjuryCause", i.injurylocation AS "InjuryLocation",
         i.surfacetype AS "SurfaceType", i.notes AS "Notes",
         i.playerid AS "PlayerID", p.firstname AS "FirstName", p.lastname AS "LastName", p.schoolid AS "SchoolID",
         i.gameid AS "GameID", g.gamedate AS "GameDate"
  FROM injuries i
  JOIN players p ON i.playerid = p.playerid
  JOIN games   g ON i.gameid   = g.gameid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role === 'COACH') {
    return res.json((await pool.query(injurySelect + ' WHERE p.coachid = $1', [req.user.CoachID])).rows);
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(injurySelect + ' WHERE p.schoolid = $1', [req.user.SchoolID])).rows);
  }
  res.json((await pool.query(injurySelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(injurySelect + ' WHERE i.injuryid = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Injury not found' });
  res.json(result.rows[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'Injury'), async (req, res) => {
  const { playerId, gameId, injuryStatus, injuryCause, injuryLocation, surfaceType, notes } = req.body;
  const pool = await getPool();
  if (req.user.Role === 'COACH') {
    const check = await pool.query('SELECT coachid FROM players WHERE playerid=$1', [playerId]);
    if (!check.rows[0] || check.rows[0].coachid !== req.user.CoachID) {
      return res.status(403).json({ message: 'Access denied — not your player' });
    }
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    const check = await pool.query('SELECT schoolid FROM players WHERE playerid=$1', [playerId]);
    if (!check.rows[0] || check.rows[0].schoolid !== req.user.SchoolID) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }
  const result = await pool.query(
    `INSERT INTO injuries (playerid, gameid, injurystatus, injurycause, injurylocation, surfacetype, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING injuryid`,
    [playerId, gameId, injuryStatus, injuryCause||null, injuryLocation||null, surfaceType||null, notes||null]
  );
  const full = await pool.query(injurySelect + ' WHERE i.injuryid = $1', [result.rows[0].injuryid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Injury'), async (req, res) => {
  const { injuryStatus, injuryCause, injuryLocation, surfaceType, notes } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE injuries SET injurystatus=$1, injurycause=$2, injurylocation=$3, surfacetype=$4, notes=$5 WHERE injuryid=$6`,
    [injuryStatus, injuryCause||null, injuryLocation||null, surfaceType||null, notes||null, req.params.id]
  );
  const full = await pool.query(injurySelect + ' WHERE i.injuryid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
