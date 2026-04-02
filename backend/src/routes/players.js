const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const playerSelect = `
  SELECT p.PlayerID AS _id, p.PlayerID, p.FirstName, p.LastName, p.Sex, p.PhoneNumber, p.Email,
         p.StreetAddress, p.PostalCode, a.CityName, a.ProvinceName,
         p.SchoolID, s.SchoolName, p.Status, p.RecruitingRank, p.HighSchool,
         p.RecruitSourceID, rs.SourceName, rs.SourceType,
         p.CoachID, c.FirstName AS CoachFirstName, c.LastName AS CoachLastName,
         (SELECT STRING_AGG(pos.PositionName, ', ')
          FROM PlayerPosition pp
          JOIN Position pos ON pp.PositionID = pos.PositionID
          WHERE pp.PlayerID = p.PlayerID) AS Positions
  FROM Player p
  JOIN Address a ON p.PostalCode = a.PostalCode
  JOIN School  s ON p.SchoolID   = s.SchoolID
  LEFT JOIN RecruitingSource rs ON p.RecruitSourceID = rs.RecruitSourceID
  LEFT JOIN Coach c ON p.CoachID = c.CoachID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  let query = playerSelect;
  const request = pool.request();
  if (req.user.Role === 'COACH') {
    query += ' WHERE p.CoachID = @coachId';
    request.input('coachId', sql.Int, req.user.CoachID);
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE p.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  const result = await request.query(query);
  res.json(result.recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(playerSelect + ' WHERE p.PlayerID = @id');
  const player = result.recordset[0];
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
  await pool.request()
    .input('postalCode',   sql.VarChar(10),  postalCode.toUpperCase())
    .input('cityName',     sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  const result = await pool.request()
    .input('firstName',           sql.VarChar(50),  firstName)
    .input('lastName',            sql.VarChar(50),  lastName)
    .input('sex',                 sql.Char(1),      sex)
    .input('phoneNumber',         sql.VarChar(15),  phoneNumber || null)
    .input('email',               sql.VarChar(100), email || null)
    .input('streetAddress',       sql.VarChar(100), streetAddress)
    .input('postalCode',          sql.VarChar(10),  postalCode.toUpperCase())
    .input('schoolId',            sql.Int,          schoolId)
    .input('status',              sql.VarChar(20),  status || 'Active')
    .input('recruitingRank',      sql.Int,          recruitingRank || null)
    .input('highSchool',      sql.VarChar(100), highSchool      || null)
    .input('recruitSourceId', sql.Int,          recruitSourceId || null)
    .input('coachId',         sql.Int,          coachId         || null)
    .query(`INSERT INTO Player (FirstName, LastName, Sex, PhoneNumber, Email, StreetAddress,
              PostalCode, SchoolID, Status, RecruitingRank, HighSchool, RecruitSourceID, CoachID)
            OUTPUT INSERTED.PlayerID
            VALUES (@firstName, @lastName, @sex, @phoneNumber, @email, @streetAddress,
              @postalCode, @schoolId, @status, @recruitingRank, @highSchool, @recruitSourceId, @coachId)`);

  const newId = result.recordset[0].PlayerID;

  // Save positions to junction table
  if (Array.isArray(positionIds) && positionIds.length > 0) {
    for (const posId of positionIds) {
      await pool.request()
        .input('playerId',   sql.Int, newId)
        .input('positionId', sql.Int, posId)
        .query('INSERT INTO PlayerPosition (PlayerID, PositionID) VALUES (@playerId, @positionId)');
    }
  }

  const full = await pool.request().input('id', sql.Int, newId).query(playerSelect + ' WHERE p.PlayerID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('UPDATE', 'Player'), async (req, res) => {
  const pool = await getPool();
  const existing = await pool.request().input('id', sql.Int, req.params.id).query('SELECT SchoolID FROM Player WHERE PlayerID = @id');
  if (!existing.recordset[0]) return res.status(404).json({ message: 'Player not found' });
  if (req.user.Role !== 'CNSA_ADMIN' && existing.recordset[0].SchoolID !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { firstName, lastName, sex, phoneNumber, email, streetAddress, postalCode,
          cityName, provinceName, schoolId, status, recruitingRank, highSchool,
          recruitSourceId } = req.body;

  const coachId = req.user.Role === 'COACH' ? req.user.CoachID : (req.body.coachId || null);

  await pool.request()
    .input('postalCode', sql.VarChar(10), postalCode.toUpperCase())
    .input('cityName', sql.VarChar(100), cityName)
    .input('provinceName', sql.VarChar(100), provinceName)
    .query(`IF NOT EXISTS (SELECT 1 FROM Address WHERE PostalCode = @postalCode)
              INSERT INTO Address (PostalCode, CityName, ProvinceName) VALUES (@postalCode, @cityName, @provinceName)`);

  await pool.request()
    .input('id',                  sql.Int,          req.params.id)
    .input('firstName',           sql.VarChar(50),  firstName)
    .input('lastName',            sql.VarChar(50),  lastName)
    .input('sex',                 sql.Char(1),      sex)
    .input('phoneNumber',         sql.VarChar(15),  phoneNumber || null)
    .input('email',               sql.VarChar(100), email || null)
    .input('streetAddress',       sql.VarChar(100), streetAddress)
    .input('postalCode',          sql.VarChar(10),  postalCode.toUpperCase())
    .input('schoolId',            sql.Int,          schoolId)
    .input('status',              sql.VarChar(20),  status)
    .input('recruitingRank',      sql.Int,          recruitingRank || null)
    .input('highSchool',      sql.VarChar(100), highSchool      || null)
    .input('recruitSourceId', sql.Int,          recruitSourceId || null)
    .input('coachId',         sql.Int,          coachId         || null)
    .query(`UPDATE Player SET FirstName=@firstName, LastName=@lastName, Sex=@sex,
            PhoneNumber=@phoneNumber, Email=@email, StreetAddress=@streetAddress,
            PostalCode=@postalCode, SchoolID=@schoolId, Status=@status,
            RecruitingRank=@recruitingRank, HighSchool=@highSchool,
            RecruitSourceID=@recruitSourceId, CoachID=@coachId
            WHERE PlayerID=@id`);

  const { positionIds } = req.body;
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query('DELETE FROM PlayerPosition WHERE PlayerID = @id');
  if (Array.isArray(positionIds) && positionIds.length > 0) {
    for (const posId of positionIds) {
      await pool.request()
        .input('playerId',   sql.Int, req.params.id)
        .input('positionId', sql.Int, posId)
        .query('INSERT INTO PlayerPosition (PlayerID, PositionID) VALUES (@playerId, @positionId)');
    }
  }

  const full = await pool.request().input('id', sql.Int, req.params.id).query(playerSelect + ' WHERE p.PlayerID = @id');
  res.json(full.recordset[0]);
});

router.patch('/:id/status', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('STATUS_CHANGE', 'Player'), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Graduated', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const pool = await getPool();
  await pool.request()
    .input('id',     sql.Int,        req.params.id)
    .input('status', sql.VarChar(20), status)
    .query('UPDATE Player SET Status = @status WHERE PlayerID = @id');
  res.json({ PlayerID: req.params.id, Status: status });
});

module.exports = router;
