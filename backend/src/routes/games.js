const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const gameSelect = `
  SELECT g.gameid AS "_id", g.gameid AS "GameID", g.gamedate AS "GameDate",
         g.hometeamscore AS "HomeTeamScore", g.awayteamscore AS "AwayTeamScore", g.attendance AS "Attendance",
         g.hometeamid AS "HomeTeamID", hs.schoolname AS "HomeSchool",
         g.awayteamid AS "AwayTeamID", as2.schoolname AS "AwaySchool",
         g.stadiumid AS "StadiumID", st.stadiumname AS "StadiumName"
  FROM games g
  JOIN teams   ht  ON g.hometeamid = ht.teamid
  JOIN schools hs  ON ht.schoolid  = hs.schoolid
  JOIN teams   awt ON g.awayteamid = awt.teamid
  JOIN schools as2 ON awt.schoolid = as2.schoolid
  JOIN stadiums st ON g.stadiumid  = st.stadiumid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(
      gameSelect + ' WHERE ht.schoolid=$1 OR awt.schoolid=$1 ORDER BY g.gamedate DESC',
      [req.user.SchoolID]
    )).rows);
  }
  res.json((await pool.query(gameSelect + ' ORDER BY g.gamedate DESC')).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(gameSelect + ' WHERE g.gameid = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Game not found' });
  const stats = await pool.query(
    `SELECT gs.*, p.firstname AS "FirstName", p.lastname AS "LastName", pos.positionname AS "PositionName"
     FROM gamestats gs
     JOIN players p ON gs.playerid = p.playerid
     LEFT JOIN positions pos ON gs.positionid = pos.positionid
     WHERE gs.gameid = $1`,
    [req.params.id]
  );
  res.json({ ...result.rows[0], playerStats: stats.rows });
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Game'), async (req, res) => {
  const { homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore, awayTeamScore, attendance } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO games (hometeamid, awayteamid, stadiumid, gamedate, hometeamscore, awayteamscore, attendance)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING gameid`,
    [homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore||0, awayTeamScore||0, attendance||null]
  );
  const full = await pool.query(gameSelect + ' WHERE g.gameid = $1', [result.rows[0].gameid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Game'), async (req, res) => {
  const { homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore, awayTeamScore, attendance } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE games SET hometeamid=$1, awayteamid=$2, stadiumid=$3, gamedate=$4,
     hometeamscore=$5, awayteamscore=$6, attendance=$7 WHERE gameid=$8`,
    [homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore||0, awayTeamScore||0, attendance||null, req.params.id]
  );
  const full = await pool.query(gameSelect + ' WHERE g.gameid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
