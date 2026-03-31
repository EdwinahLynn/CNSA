const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const coachSelect = `
  SELECT c.CoachID AS _id, c.CoachID, c.FirstName, c.LastName, c.Sex, c.PhoneNumber, c.Email,
         c.StreetAddress, c.PostalCode, a.CityName, a.ProvinceName,
         c.SchoolID, s.SchoolName
  FROM Coach c
  JOIN Address a ON c.PostalCode = a.PostalCode
  JOIN School  s ON c.SchoolID   = s.SchoolID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = coachSelect;
  if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE c.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  const result = await request.query(query);
  res.json(result.recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(coachSelect + ' WHERE c.CoachID = @id');
  if (!result.recordset[0]) return res.status(404).json({ message: 'Coach not found' });
  res.json(result.recordset[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Coach'), async (req, res) => {
  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode,
          cityName, provinceName, schoolId } = req.body;

  if (req.user.Role !== 'CNSA_ADMIN' && Number(schoolId) !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Can only add coaches to your own school' });
  }

  const pool = await getPool();
  await pool.request()
    .input('postalCode', sql.VarChar(10), postalCode.toUpperCase())
    .input('cityName', sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  const result = await pool.request()
    .input('firstName',    sql.VarChar(50),  firstName)
    .input('lastName',     sql.VarChar(50),  lastName)
    .input('sex',          sql.Char(1),      sex)
    .input('phoneNumber',  sql.VarChar(15),  phoneNumber || null)
    .input('email',        sql.VarChar(100), email || null)
    .input('streetAddress',sql.VarChar(100), streetAddress)
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('schoolId',     sql.Int,          schoolId)
    .query(`INSERT INTO Coach (FirstName, LastName, Sex, PhoneNumber, Email, StreetAddress, PostalCode, SchoolID)
            OUTPUT INSERTED.CoachID
            VALUES (@firstName, @lastName, @sex, @phoneNumber, @email, @streetAddress, @postalCode, @schoolId)`);

  const newId = result.recordset[0].CoachID;
  const full  = await pool.request().input('id', sql.Int, newId).query(coachSelect + ' WHERE c.CoachID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Coach'), async (req, res) => {
  const pool = await getPool();
  const existing = await pool.request().input('id', sql.Int, req.params.id).query('SELECT SchoolID FROM Coach WHERE CoachID = @id');
  if (!existing.recordset[0]) return res.status(404).json({ message: 'Coach not found' });
  if (req.user.Role !== 'CNSA_ADMIN' && existing.recordset[0].SchoolID !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode, cityName, provinceName, schoolId } = req.body;

  await pool.request()
    .input('postalCode', sql.VarChar(10), postalCode.toUpperCase())
    .input('cityName', sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  await pool.request()
    .input('id',           sql.Int,          req.params.id)
    .input('firstName',    sql.VarChar(50),  firstName)
    .input('lastName',     sql.VarChar(50),  lastName)
    .input('sex',          sql.Char(1),      sex)
    .input('phoneNumber',  sql.VarChar(15),  phoneNumber || null)
    .input('email',        sql.VarChar(100), email || null)
    .input('streetAddress',sql.VarChar(100), streetAddress)
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('schoolId',     sql.Int,          schoolId)
    .query(`UPDATE Coach SET FirstName=@firstName, LastName=@lastName, Sex=@sex,
            PhoneNumber=@phoneNumber, Email=@email, StreetAddress=@streetAddress,
            PostalCode=@postalCode, SchoolID=@schoolId WHERE CoachID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(coachSelect + ' WHERE c.CoachID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
