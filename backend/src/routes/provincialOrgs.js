const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(
    'SELECT OrganizationID AS _id, OrganizationID, OrganizationName FROM ProvincialOrganization'
  );
  res.json(result.recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { organizationName } = req.body;
  const pool = await getPool();
  const result = await pool.request()
    .input('organizationName', sql.VarChar(100), organizationName)
    .query(`INSERT INTO ProvincialOrganization (OrganizationName)
            OUTPUT INSERTED.OrganizationID, INSERTED.OrganizationName
            VALUES (@organizationName)`);
  res.status(201).json(result.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { organizationName } = req.body;
  const pool = await getPool();
  await pool.request()
    .input('id',               sql.Int,          req.params.id)
    .input('organizationName', sql.VarChar(100), organizationName)
    .query('UPDATE ProvincialOrganization SET OrganizationName=@organizationName WHERE OrganizationID=@id');
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query('SELECT OrganizationID AS _id, OrganizationID, OrganizationName FROM ProvincialOrganization WHERE OrganizationID=@id');
  res.json(result.recordset[0]);
});

module.exports = router;
