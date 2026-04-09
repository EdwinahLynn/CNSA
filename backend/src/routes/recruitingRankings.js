const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const select = `
  SELECT rr.rankingid AS "_id", rr.rankingid AS "RankingID", rr.playerid AS "PlayerID",
         rr.rankingvalue AS "RankingValue", rr.rankingyear AS "RankingYear",
         p.firstname AS "FirstName", p.lastname AS "LastName"
  FROM recruitingranking rr JOIN players p ON rr.playerid=p.playerid
`;

router.get('/player/:playerId', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.query(select + ' WHERE rr.playerid=$1 ORDER BY rr.rankingyear DESC', [req.params.playerId])).rows);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'RecruitingRanking'), async (req, res) => {
  const { playerId, rankingValue, rankingYear } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO recruitingranking (playerid, rankingvalue, rankingyear) VALUES ($1,$2,$3) RETURNING rankingid`,
    [playerId, rankingValue, rankingYear]
  );
  const full = await pool.query(select + ' WHERE rr.rankingid=$1', [result.rows[0].rankingid]);
  res.status(201).json(full.rows[0]);
});

router.delete('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.query('DELETE FROM recruitingranking WHERE rankingid=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
