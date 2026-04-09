const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const schoolSelect = `
  SELECT schoolid AS "_id", schoolid AS "SchoolID", schoolname AS "SchoolName",
         schoolpopulation AS "SchoolPopulation", streetaddress AS "StreetAddress",
         postalcode AS "PostalCode", cityname AS "CityName", provincename AS "ProvinceName"
  FROM schools
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.query(schoolSelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(schoolSelect + ' WHERE schoolid = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'School not found' });
  res.json(result.rows[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN'), auditAction('CREATE', 'School'), async (req, res) => {
  const { schoolName, schoolPopulation, streetAddress, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO schools (schoolname, schoolpopulation, streetaddress, postalcode, cityname, provincename)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING schoolid`,
    [schoolName, schoolPopulation || null, streetAddress, postalCode.toUpperCase(), cityName, provinceName]
  );
  const full = await pool.query(schoolSelect + ' WHERE schoolid = $1', [result.rows[0].schoolid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), auditAction('UPDATE', 'School'), async (req, res) => {
  const { schoolName, schoolPopulation, streetAddress, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE schools SET schoolname=$1, schoolpopulation=$2, streetaddress=$3, postalcode=$4, cityname=$5, provincename=$6 WHERE schoolid=$7`,
    [schoolName, schoolPopulation || null, streetAddress, postalCode.toUpperCase(), cityName, provinceName, req.params.id]
  );
  const full = await pool.query(schoolSelect + ' WHERE schoolid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
