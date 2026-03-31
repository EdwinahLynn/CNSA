const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const stadiumSelect = `
  SELECT st.StadiumID AS _id, st.StadiumID, st.StadiumName, st.StreetAddress, st.PostalCode,
         st.StadiumCapacity, a.CityName, a.ProvinceName
  FROM Stadium st
  JOIN Address a ON st.PostalCode = a.PostalCode
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query(stadiumSelect)).recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().input('id', sql.Int, req.params.id).query(stadiumSelect + ' WHERE st.StadiumID = @id');
  if (!result.recordset[0]) return res.status(404).json({ message: 'Stadium not found' });
  res.json(result.recordset[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { stadiumName, streetAddress, postalCode, cityName, provinceName, stadiumCapacity } = req.body;
  const pool = await getPool();

  await pool.request()
    .input('postalCode', sql.VarChar(10), postalCode.toUpperCase())
    .input('cityName', sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  const result = await pool.request()
    .input('stadiumName',     sql.VarChar(100), stadiumName)
    .input('streetAddress',   sql.VarChar(100), streetAddress)
    .input('postalCode',      sql.VarChar(10),  postalCode.toUpperCase())
    .input('stadiumCapacity', sql.Int,          stadiumCapacity)
    .query(`INSERT INTO Stadium (StadiumName, StreetAddress, PostalCode, StadiumCapacity)
            OUTPUT INSERTED.StadiumID
            VALUES (@stadiumName, @streetAddress, @postalCode, @stadiumCapacity)`);

  const newId = result.recordset[0].StadiumID;
  const full  = await pool.request().input('id', sql.Int, newId).query(stadiumSelect + ' WHERE st.StadiumID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { stadiumName, streetAddress, postalCode, cityName, provinceName, stadiumCapacity } = req.body;
  const pool = await getPool();

  await pool.request()
    .input('postalCode', sql.VarChar(10), postalCode.toUpperCase())
    .input('cityName', sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  await pool.request()
    .input('id',              sql.Int,          req.params.id)
    .input('stadiumName',     sql.VarChar(100), stadiumName)
    .input('streetAddress',   sql.VarChar(100), streetAddress)
    .input('postalCode',      sql.VarChar(10),  postalCode.toUpperCase())
    .input('stadiumCapacity', sql.Int,          stadiumCapacity)
    .query(`UPDATE Stadium SET StadiumName=@stadiumName, StreetAddress=@streetAddress,
            PostalCode=@postalCode, StadiumCapacity=@stadiumCapacity WHERE StadiumID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(stadiumSelect + ' WHERE st.StadiumID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
