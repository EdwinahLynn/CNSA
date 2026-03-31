const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const scholarshipSelect = `
  SELECT sc.ScholarshipID AS _id, sc.ScholarshipID, sc.ScholarshipName, sc.ScholarshipAmount, sc.DateAwarded,
         sc.PlayerID, p.FirstName, p.LastName, p.SchoolID, s.SchoolName
  FROM Scholarship sc
  JOIN Player p ON sc.PlayerID = p.PlayerID
  JOIN School  s ON p.SchoolID  = s.SchoolID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = scholarshipSelect;
  if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE p.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  res.json((await request.query(query)).recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Scholarship'), async (req, res) => {
  const { playerId, scholarshipName, scholarshipAmount, dateAwarded } = req.body;

  if (req.user.Role !== 'CNSA_ADMIN') {
    const pool = await getPool();
    const check = await pool.request().input('id', sql.Int, playerId).query('SELECT SchoolID FROM Player WHERE PlayerID = @id');
    if (!check.recordset[0] || check.recordset[0].SchoolID !== req.user.SchoolID) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('playerId',          sql.Int,          playerId)
    .input('scholarshipName',   sql.VarChar(100), scholarshipName)
    .input('scholarshipAmount', sql.Decimal(10,2), scholarshipAmount || null)
    .input('dateAwarded',       sql.Date,          dateAwarded)
    .query(`INSERT INTO Scholarship (PlayerID, ScholarshipName, ScholarshipAmount, DateAwarded)
            OUTPUT INSERTED.ScholarshipID
            VALUES (@playerId, @scholarshipName, @scholarshipAmount, @dateAwarded)`);

  const newId = result.recordset[0].ScholarshipID;
  const full  = await pool.request().input('id', sql.Int, newId).query(scholarshipSelect + ' WHERE sc.ScholarshipID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Scholarship'), async (req, res) => {
  const { scholarshipName, scholarshipAmount, dateAwarded } = req.body;
  const pool = await getPool();
  await pool.request()
    .input('id',                sql.Int,          req.params.id)
    .input('scholarshipName',   sql.VarChar(100), scholarshipName)
    .input('scholarshipAmount', sql.Decimal(10,2), scholarshipAmount || null)
    .input('dateAwarded',       sql.Date,          dateAwarded)
    .query(`UPDATE Scholarship SET ScholarshipName=@scholarshipName,
            ScholarshipAmount=@scholarshipAmount, DateAwarded=@dateAwarded
            WHERE ScholarshipID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(scholarshipSelect + ' WHERE sc.ScholarshipID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
