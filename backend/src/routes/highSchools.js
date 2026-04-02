const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const select = `
  SELECT hs.HighSchoolID AS _id, hs.HighSchoolID, hs.HighSchoolName,
         hs.PostalCode, a.CityName, a.ProvinceName
  FROM HighSchool hs
  JOIN Address a ON hs.PostalCode = a.PostalCode
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query(select)).recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { highSchoolName, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();

  await pool.request()
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('cityName',     sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  const result = await pool.request()
    .input('highSchoolName', sql.VarChar(100), highSchoolName)
    .input('postalCode',     sql.VarChar(10),  postalCode.toUpperCase())
    .query(`INSERT INTO HighSchool (HighSchoolName, PostalCode)
            OUTPUT INSERTED.HighSchoolID
            VALUES (@highSchoolName, @postalCode)`);

  const newId = result.recordset[0].HighSchoolID;
  const full  = await pool.request().input('id', sql.Int, newId).query(select + ' WHERE hs.HighSchoolID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { highSchoolName, postalCode, cityName, provinceName } = req.body;
  const pool = await getPool();

  await pool.request()
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('cityName',     sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  await pool.request()
    .input('id',             sql.Int,          req.params.id)
    .input('highSchoolName', sql.VarChar(100), highSchoolName)
    .input('postalCode',     sql.VarChar(10),  postalCode.toUpperCase())
    .query(`UPDATE HighSchool SET HighSchoolName=@highSchoolName, PostalCode=@postalCode WHERE HighSchoolID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(select + ' WHERE hs.HighSchoolID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
