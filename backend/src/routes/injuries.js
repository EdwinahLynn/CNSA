const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const injurySelect = `
  SELECT i.InjuryID AS _id, i.InjuryID, i.InjuryStatus, i.InjuryCause, i.InjuryLocation, i.SurfaceType, i.Notes,
         i.PlayerID, p.FirstName, p.LastName, p.SchoolID,
         i.GameID, g.GameDate
  FROM Injury i
  JOIN Player p ON i.PlayerID = p.PlayerID
  JOIN Game   g ON i.GameID   = g.GameID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  const request = pool.request();
  let query = injurySelect;
  if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE p.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  res.json((await request.query(query)).recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(injurySelect + ' WHERE i.InjuryID = @id');
  if (!result.recordset[0]) return res.status(404).json({ message: 'Injury not found' });
  res.json(result.recordset[0]);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'Injury'), async (req, res) => {
  const { playerId, gameId, injuryStatus, injuryCause, injuryLocation, surfaceType, notes } = req.body;

  if (req.user.Role !== 'CNSA_ADMIN') {
    const pool = await getPool();
    const check = await pool.request().input('id', sql.Int, playerId).query('SELECT SchoolID FROM Player WHERE PlayerID = @id');
    if (!check.recordset[0] || check.recordset[0].SchoolID !== req.user.SchoolID) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('playerId',       sql.Int,        playerId)
    .input('gameId',         sql.Int,        gameId)
    .input('injuryStatus',   sql.VarChar(50),  injuryStatus)
    .input('injuryCause',    sql.VarChar(100), injuryCause || null)
    .input('injuryLocation', sql.VarChar(100), injuryLocation || null)
    .input('surfaceType',    sql.VarChar(20),  surfaceType || null)
    .input('notes',          sql.Text,         notes || null)
    .query(`INSERT INTO Injury (PlayerID, GameID, InjuryStatus, InjuryCause, InjuryLocation, SurfaceType, Notes)
            OUTPUT INSERTED.InjuryID
            VALUES (@playerId, @gameId, @injuryStatus, @injuryCause, @injuryLocation, @surfaceType, @notes)`);

  const newId = result.recordset[0].InjuryID;
  const full  = await pool.request().input('id', sql.Int, newId).query(injurySelect + ' WHERE i.InjuryID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Injury'), async (req, res) => {
  const { injuryStatus, injuryCause, injuryLocation, surfaceType, notes } = req.body;
  const pool = await getPool();
  await pool.request()
    .input('id',             sql.Int,          req.params.id)
    .input('injuryStatus',   sql.VarChar(50),  injuryStatus)
    .input('injuryCause',    sql.VarChar(100), injuryCause || null)
    .input('injuryLocation', sql.VarChar(100), injuryLocation || null)
    .input('surfaceType',    sql.VarChar(20),  surfaceType || null)
    .input('notes',          sql.Text,         notes || null)
    .query(`UPDATE Injury SET InjuryStatus=@injuryStatus, InjuryCause=@injuryCause,
            InjuryLocation=@injuryLocation, SurfaceType=@surfaceType, Notes=@notes
            WHERE InjuryID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(injurySelect + ' WHERE i.InjuryID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
