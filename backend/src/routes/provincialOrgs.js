const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT organizationid AS "_id", organizationid AS "OrganizationID", organizationname AS "OrganizationName"
     FROM provincialorganization`
  );
  res.json(result.rows);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO provincialorganization (organizationname) VALUES ($1)
     RETURNING organizationid AS "_id", organizationid AS "OrganizationID", organizationname AS "OrganizationName"`,
    [req.body.organizationName]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.query(
    'UPDATE provincialorganization SET organizationname=$1 WHERE organizationid=$2',
    [req.body.organizationName, req.params.id]
  );
  const result = await pool.query(
    `SELECT organizationid AS "_id", organizationid AS "OrganizationID", organizationname AS "OrganizationName"
     FROM provincialorganization WHERE organizationid=$1`,
    [req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
