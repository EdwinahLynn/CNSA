const router = require('express').Router();
const { getPool } = require('../config/db');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const playerSelect = `
  SELECT p.playerid AS "_id", p.playerid AS "PlayerID", p.firstname AS "FirstName", p.lastname AS "LastName",
         p.sex AS "Sex", p.phonenumber AS "PhoneNumber", p.email AS "Email",
         p.streetaddress AS "StreetAddress", p.postalcode AS "PostalCode",
         p.cityname AS "CityName", p.provincename AS "ProvinceName",
         p.schoolid AS "SchoolID", s.schoolname AS "SchoolName",
         p.status AS "Status", p.recruitingrank AS "RecruitingRank", p.highschool AS "HighSchool",
         p.recruitsourceid AS "RecruitSourceID", rs.sourcename AS "SourceName", rs.sourcetype AS "SourceType",
         p.coachid AS "CoachID", c.firstname AS "CoachFirstName", c.lastname AS "CoachLastName",
         (SELECT STRING_AGG(pos.positionname, ', ')
          FROM playerposition pp
          JOIN positions pos ON pp.positionid = pos.positionid
          WHERE pp.playerid = p.playerid) AS "Positions"
  FROM players p
  JOIN schools s ON p.schoolid = s.schoolid
  LEFT JOIN recruitingsource rs ON p.recruitsourceid = rs.recruitsourceid
  LEFT JOIN coachs c ON p.coachid = c.coachid
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  if (req.user.Role === 'COACH') {
    return res.json((await pool.query(playerSelect + ' WHERE p.coachid = $1', [req.user.CoachID])).rows);
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    return res.json((await pool.query(playerSelect + ' WHERE p.schoolid = $1', [req.user.SchoolID])).rows);
  }
  res.json((await pool.query(playerSelect)).rows);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.query(playerSelect + ' WHERE p.playerid = $1', [req.params.id]);
  const player = result.rows[0];
  if (!player) return res.status(404).json({ message: 'Player not found' });
  if (req.user.Role !== 'CNSA_ADMIN' && player.SchoolID !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json(player);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'Player'), async (req, res) => {
  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode,
    cityName, provinceName, schoolId, status, recruitingRank, highSchool,
    recruitSourceId, positionIds } = req.body;
  const coachId = req.user.Role === 'COACH' ? req.user.CoachID : (req.body.coachId || null);
  if (req.user.Role !== 'CNSA_ADMIN' && Number(schoolId) !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Can only add players to your own school' });
  }
  const pool = await getPool();
  const result = await pool.query(
    `INSERT INTO players (firstname, lastname, sex, phonenumber, email, streetaddress,
       postalcode, cityname, provincename, schoolid, status, recruitingrank, highschool, recruitsourceid, coachid)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING playerid`,
    [firstName, lastName, sex, phoneNumber||null, email||null, streetAddress,
     postalCode?.toUpperCase(), cityName, provinceName, schoolId, status||'Active',
     recruitingRank||null, highSchool||null, recruitSourceId||null, coachId||null]
  );
  const newId = result.rows[0].playerid;
  if (Array.isArray(positionIds) && positionIds.length > 0) {
    for (const posId of positionIds) {
      await pool.query('INSERT INTO playerposition (playerid, positionid) VALUES ($1,$2)', [newId, posId]);
    }
  }
  const full = await pool.query(playerSelect + ' WHERE p.playerid = $1', [newId]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('UPDATE', 'Player'), async (req, res) => {
  const pool = await getPool();
  const existing = await pool.query('SELECT schoolid FROM players WHERE playerid = $1', [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ message: 'Player not found' });
  if (req.user.Role !== 'CNSA_ADMIN' && existing.rows[0].schoolid !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode,
    cityName, provinceName, schoolId, status, recruitingRank, highSchool,
    recruitSourceId, positionIds } = req.body;
  const coachId = req.user.Role === 'COACH' ? req.user.CoachID : (req.body.coachId || null);
  await pool.query(
    `UPDATE players SET firstname=$1, lastname=$2, sex=$3, phonenumber=$4, email=$5,
     streetaddress=$6, postalcode=$7, cityname=$8, provincename=$9, schoolid=$10, status=$11,
     recruitingrank=$12, highschool=$13, recruitsourceid=$14, coachid=$15 WHERE playerid=$16`,
    [firstName, lastName, sex, phoneNumber||null, email||null, streetAddress,
     postalCode?.toUpperCase(), cityName, provinceName, schoolId, status,
     recruitingRank||null, highSchool||null, recruitSourceId||null, coachId||null, req.params.id]
  );
  await pool.query('DELETE FROM playerposition WHERE playerid = $1', [req.params.id]);
  if (Array.isArray(positionIds) && positionIds.length > 0) {
    for (const posId of positionIds) {
      await pool.query('INSERT INTO playerposition (playerid, positionid) VALUES ($1,$2)', [req.params.id, posId]);
    }
  }
  const full = await pool.query(playerSelect + ' WHERE p.playerid = $1', [req.params.id]);
  res.json(full.rows[0]);
});

router.patch('/:id/status', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('STATUS_CHANGE', 'Player'), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Graduated', 'Inactive'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const pool = await getPool();
  await pool.query('UPDATE players SET status=$1 WHERE playerid=$2', [status, req.params.id]);
  res.json({ PlayerID: req.params.id, Status: status });
});

module.exports = router;
