const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const select = `
  SELECT highschoolid AS "_id", highschoolid AS "HighSchoolID", highschoolname AS "HighSchoolName",
         postalcode AS "PostalCode", cityname AS "CityName", provincename AS "ProvinceName"
  FROM highschools
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.query(select)).rows);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { highSchoolName, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO highschools (highschoolname, postalcode, cityname, provincename) VALUES ($1,$2,$3,$4) RETURNING highschoolid`,
    [highSchoolName, postalCode?.toUpperCase(), cityName, provinceName]
  );
  const full = await pool.query(select + ' WHERE highschoolid=$1', [result.rows[0].highschoolid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { highSchoolName, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE highschools SET highschoolname=$1, postalcode=$2, cityname=$3, provincename=$4 WHERE highschoolid=$5`,
    [highSchoolName, postalCode?.toUpperCase(), cityName, provinceName, req.params.id]
  );
  const full = await pool.query(select + ' WHERE highschoolid=$1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
