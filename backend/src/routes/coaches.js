const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const coachSelect = `
  SELECT c.coachid AS "_id", c.coachid AS "CoachID", c.firstname AS "FirstName", c.lastname AS "LastName",
         c.sex AS "Sex", c.phonenumber AS "PhoneNumber", c.email AS "Email",
         c.streetaddress AS "StreetAddress", c.postalcode AS "PostalCode",
         c.cityname AS "CityName", c.provincename AS "ProvinceName",
         c.schoolid AS "SchoolID", s.schoolname AS "SchoolName"
  FROM coachs c
  JOIN schools s ON c.schoolid = s.schoolid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(coachSelect + ' WHERE c.schoolid = $1', [req.user.SchoolID])).rows);
  }
  res.json((await pool.query(coachSelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(coachSelect + ' WHERE c.coachid = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Coach not found' });
  res.json(result.rows[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Coach'), async (req, res) => {
  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode, cityName, provinceName, schoolId } = req.body;
  if (req.user.Role !== 'CNSA_ADMIN' && Number(schoolId) !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Can only add coaches to your own school' });
  }
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO coachs (firstname, lastname, sex, phonenumber, email, streetaddress, postalcode, cityname, provincename, schoolid)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING coachid`,
    [firstName, lastName, sex, phoneNumber || null, email || null, streetAddress, postalCode?.toUpperCase(), cityName, provinceName, schoolId]
  );
  const full = await pool.query(coachSelect + ' WHERE c.coachid = $1', [result.rows[0].coachid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Coach'), async (req, res) => {
  const pool = await getPool();
  const existing = await pool.query('SELECT schoolid FROM coachs WHERE coachid = $1', [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ message: 'Coach not found' });
  if (req.user.Role !== 'CNSA_ADMIN' && existing.rows[0].schoolid !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode, cityName, provinceName, schoolId } = req.body;
  await pool.query(
    `UPDATE coachs SET firstname=$1, lastname=$2, sex=$3, phonenumber=$4, email=$5,
     streetaddress=$6, postalcode=$7, cityname=$8, provincename=$9, schoolid=$10 WHERE coachid=$11`,
    [firstName, lastName, sex, phoneNumber || null, email || null, streetAddress, postalCode?.toUpperCase(), cityName, provinceName, schoolId, req.params.id]
  );
  const full = await pool.query(coachSelect + ' WHERE c.coachid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
