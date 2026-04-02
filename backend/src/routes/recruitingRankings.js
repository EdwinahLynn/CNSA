const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const select = `
  SELECT rr.RankingID AS _id, rr.RankingID, rr.PlayerID, rr.RankingValue, rr.RankingYear,
         p.FirstName, p.LastName
  FROM RecruitingRanking rr
  JOIN Player p ON rr.PlayerID = p.PlayerID
`;

router.get('/player/:playerId', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('playerId', sql.Int, req.params.playerId)
    .query(select + ' WHERE rr.PlayerID = @playerId ORDER BY rr.RankingYear DESC');
  res.json(result.recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'RecruitingRanking'), async (req, res) => {
  const { playerId, rankingValue, rankingYear } = req.body;
  const pool = await getPool();
  const result = await pool.request()
    .input('playerId',     sql.Int, playerId)
    .input('rankingValue', sql.Int, rankingValue)
    .input('rankingYear',  sql.Int, rankingYear)
    .query(`INSERT INTO RecruitingRanking (PlayerID, RankingValue, RankingYear)
            OUTPUT INSERTED.RankingID
            VALUES (@playerId, @rankingValue, @rankingYear)`);
  const newId = result.recordset[0].RankingID;
  const full  = await pool.request().input('id', sql.Int, newId).query(select + ' WHERE rr.RankingID = @id');
  res.status(201).json(full.recordset[0]);
});

router.delete('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM RecruitingRanking WHERE RankingID = @id');
  res.json({ message: 'Deleted' });
});

module.exports = router;
