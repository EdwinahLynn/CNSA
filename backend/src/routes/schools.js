const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT s.SchoolID AS _id, s.SchoolID, s.SchoolName, s.SchoolPopulation, s.StreetAddress,
           s.PostalCode, a.CityName, a.ProvinceName
    FROM School s
    JOIN Address a ON s.PostalCode = a.PostalCode
  `);
  res.json(result.recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`SELECT s.*, a.CityName, a.ProvinceName
            FROM School s JOIN Address a ON s.PostalCode = a.PostalCode
            WHERE s.SchoolID = @id`);
  if (!result.recordset[0]) return res.status(404).json({ message: 'School not found' });
  res.json(result.recordset[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN'), auditAction('CREATE', 'School'), async (req, res) => {
  const { schoolName, schoolPopulation, streetAddress, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();

  // Upsert address
  await pool.request()
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('cityName',     sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  const result = await pool.request()
    .input('schoolName',       sql.VarChar(100), schoolName)
    .input('schoolPopulation', sql.Int,          schoolPopulation || null)
    .input('streetAddress',    sql.VarChar(100), streetAddress)
    .input('postalCode',       sql.VarChar(10),  postalCode.toUpperCase())
    .query(`INSERT INTO School (SchoolName, SchoolPopulation, StreetAddress, PostalCode)
            OUTPUT INSERTED.*
            VALUES (@schoolName, @schoolPopulation, @streetAddress, @postalCode)`);

  res.status(201).json(result.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), auditAction('UPDATE', 'School'), async (req, res) => {
  const { schoolName, schoolPopulation, streetAddress, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();

  await pool.request()
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('cityName',     sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  await pool.request()
    .input('id',               sql.Int,          req.params.id)
    .input('schoolName',       sql.VarChar(100), schoolName)
    .input('schoolPopulation', sql.Int,          schoolPopulation || null)
    .input('streetAddress',    sql.VarChar(100), streetAddress)
    .input('postalCode',       sql.VarChar(10),  postalCode.toUpperCase())
    .query(`UPDATE School SET SchoolName=@schoolName, SchoolPopulation=@schoolPopulation,
            StreetAddress=@streetAddress, PostalCode=@postalCode WHERE SchoolID=@id`);

  const updated = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query('SELECT s.*, a.CityName, a.ProvinceName FROM School s JOIN Address a ON s.PostalCode=a.PostalCode WHERE SchoolID=@id');
  res.json(updated.recordset[0]);
});

module.exports = router;
