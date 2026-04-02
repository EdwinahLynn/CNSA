const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const select = `
  SELECT ri.IncidentID AS _id, ri.IncidentID, ri.PlayerID, ri.Description, ri.IncidentDate,
         p.FirstName, p.LastName
  FROM RecruitingIncident ri
  JOIN Player p ON ri.PlayerID = p.PlayerID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = select;
  if (req.user.Role === 'COACH') {
    query += ' WHERE p.CoachID = @coachId';
    request.input('coachId', sql.Int, req.user.CoachID);
  } else if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE p.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  res.json((await request.query(query)).recordset);
});

router.get('/player/:playerId', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('playerId', sql.Int, req.params.playerId)
    .query(select + ' WHERE ri.PlayerID = @playerId ORDER BY ri.IncidentDate DESC');
  res.json(result.recordset);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'RecruitingIncident'), async (req, res) => {
  const { playerId, description, incidentDate } = req.body;
  const pool = await getPool();
  const result = await pool.request()
    .input('playerId',     sql.Int,          playerId)
    .input('description',  sql.VarChar(255), description)
    .input('incidentDate', sql.Date,         incidentDate)
    .query(`INSERT INTO RecruitingIncident (PlayerID, Description, IncidentDate)
            OUTPUT INSERTED.IncidentID
            VALUES (@playerId, @description, @incidentDate)`);
  const newId = result.recordset[0].IncidentID;
  const full  = await pool.request().input('id', sql.Int, newId).query(select + ' WHERE ri.IncidentID = @id');
  res.status(201).json(full.recordset[0]);
});

router.delete('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM RecruitingIncident WHERE IncidentID = @id');
  res.json({ message: 'Deleted' });
});

module.exports = router;
