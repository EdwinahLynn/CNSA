const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect }   = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const stadiumSelect = `
  SELECT st.stadiumid AS "_id", st.stadiumid AS "StadiumID", st.stadiumname AS "StadiumName",
         st.streetaddress AS "StreetAddress", st.postalcode AS "PostalCode",
         st.stadiumcapacity AS "StadiumCapacity", st.cityname AS "CityName", st.provincename AS "ProvinceName",
         st.organizationid AS "OrganizationID", po.organizationname AS "OrganizationName"
  FROM stadiums st
  LEFT JOIN provincialorganization po ON st.organizationid = po.organizationid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.query(stadiumSelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(stadiumSelect + ' WHERE st.stadiumid=$1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ message: 'Stadium not found' });
  res.json(result.rows[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { stadiumName, streetAddress, postalCode, cityName, provinceName, stadiumCapacity, organizationId } = req.body;
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO stadiums (stadiumname, streetaddress, postalcode, cityname, provincename, stadiumcapacity, organizationid)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING stadiumid`,
    [stadiumName, streetAddress, postalCode?.toUpperCase(), cityName, provinceName, stadiumCapacity, organizationId||null]
  );
  const full = await pool.query(stadiumSelect + ' WHERE st.stadiumid=$1', [result.rows[0].stadiumid]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const { stadiumName, streetAddress, postalCode, cityName, provinceName, stadiumCapacity, organizationId } = req.body;
  const pool = await getPool();
  await pool.query(
    `UPDATE stadiums SET stadiumname=$1, streetaddress=$2, postalcode=$3, cityname=$4, provincename=$5, stadiumcapacity=$6, organizationid=$7 WHERE stadiumid=$8`,
    [stadiumName, streetAddress, postalCode?.toUpperCase(), cityName, provinceName, stadiumCapacity, organizationId||null, req.params.id]
  );
  const full = await pool.query(stadiumSelect + ' WHERE st.stadiumid=$1', [req.params.id]);
  res.json(full.rows[0]);
});

module.exports = router;
