const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const teamSelect = `
  SELECT t.TeamID AS _id, t.TeamID, t.Season, t.Gender,
         t.SchoolID, s.SchoolName,
         t.CoachID, c.FirstName AS CoachFirstName, c.LastName AS CoachLastName
  FROM Team t
  JOIN School s ON t.SchoolID = s.SchoolID
  JOIN Coach  c ON t.CoachID  = c.CoachID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = teamSelect;
  if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE t.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  const result = await request.query(query);
  res.json(result.recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(teamSelect + ' WHERE t.TeamID = @id');
  if (!result.recordset[0]) return res.status(404).json({ message: 'Team not found' });
  res.json(result.recordset[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Team'), async (req, res) => {
  const { schoolId, coachId, season, gender } = req.body;
  if (req.user.Role !== 'CNSA_ADMIN' && Number(schoolId) !== req.user.SchoolID) {
    return res.status(403).json({ message: 'Can only create teams for your own school' });
  }
  const pool = await getPool();
  const dup = await pool.request()
    .input('schoolId', sql.Int,         schoolId)
    .input('season',   sql.VarChar(10), season)
    .input('gender',   sql.VarChar(10), gender)
    .query('SELECT TeamID FROM Team WHERE SchoolID=@schoolId AND Season=@season AND Gender=@gender');
  if (dup.recordset.length > 0) {
    return res.status(409).json({ message: 'A team for this school, season, and gender already exists' });
  }
  const coachCheck = await pool.request()
    .input('coachId',  sql.Int, coachId)
    .input('schoolId', sql.Int, schoolId)
    .query('SELECT CoachID FROM Coach WHERE CoachID=@coachId AND SchoolID=@schoolId');
  if (!coachCheck.recordset[0]) {
    return res.status(400).json({ message: 'Coach does not belong to this school' });
  }
  const result = await pool.request()
    .input('schoolId', sql.Int,         schoolId)
    .input('coachId',  sql.Int,         coachId)
    .input('season',   sql.VarChar(10), season)
    .input('gender',   sql.VarChar(10), gender)
    .query(`INSERT INTO Team (SchoolID, CoachID, Season, Gender)
            OUTPUT INSERTED.TeamID
            VALUES (@schoolId, @coachId, @season, @gender)`);

  const newId = result.recordset[0].TeamID;
  const full  = await pool.request().input('id', sql.Int, newId).query(teamSelect + ' WHERE t.TeamID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Team'), async (req, res) => {
  const { schoolId, coachId, season, gender } = req.body;
  const pool = await getPool();
  const coachCheck = await pool.request()
    .input('coachId',  sql.Int, coachId)
    .input('schoolId', sql.Int, schoolId)
    .query('SELECT CoachID FROM Coach WHERE CoachID=@coachId AND SchoolID=@schoolId');
  if (!coachCheck.recordset[0]) {
    return res.status(400).json({ message: 'Coach does not belong to this school' });
  }
  await pool.request()
    .input('id',       sql.Int,         req.params.id)
    .input('schoolId', sql.Int,         schoolId)
    .input('coachId',  sql.Int,         coachId)
    .input('season',   sql.VarChar(10), season)
    .input('gender',   sql.VarChar(10), gender)
    .query('UPDATE Team SET SchoolID=@schoolId, CoachID=@coachId, Season=@season, Gender=@gender WHERE TeamID=@id');

  const full = await pool.request().input('id', sql.Int, req.params.id).query(teamSelect + ' WHERE t.TeamID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
