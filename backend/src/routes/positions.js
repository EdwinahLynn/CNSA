const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT positionid AS "_id", positionid AS "PositionID", positionname AS "PositionName" FROM position`
  );
  res.json(result.rows);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO position (positionname) VALUES ($1)
     RETURNING positionid AS "_id", positionid AS "PositionID", positionname AS "PositionName"`,
    [req.body.positionName]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
