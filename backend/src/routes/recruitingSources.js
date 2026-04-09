const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT recruitsourceid AS "_id", recruitsourceid AS "RecruitSourceID",
            sourcename AS "SourceName", sourcetype AS "SourceType"
     FROM recruitingsource`
  );
  res.json(result.rows);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO recruitingsource (sourcename, sourcetype) VALUES ($1, $2)
     RETURNING recruitsourceid AS "_id", recruitsourceid AS "RecruitSourceID",
               sourcename AS "SourceName", sourcetype AS "SourceType"`,
    [req.body.sourceName, req.body.sourceType]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
