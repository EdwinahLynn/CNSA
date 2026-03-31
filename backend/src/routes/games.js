const router = require('express').Router();
const { getPool, sql } = require('../config/db');
const { protect }    = require('../middleware/auth');
const { authorize }  = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

const gameSelect = `
  SELECT g.GameID AS _id, g.GameID, g.GameDate, g.HomeTeamScore, g.AwayTeamScore, g.Attendance,
         g.HomeTeamID, hs.SchoolName AS HomeSchool,
         g.AwayTeamID, as2.SchoolName AS AwaySchool,
         g.StadiumID, st.StadiumName
  FROM Game g
  JOIN Team    ht  ON g.HomeTeamID = ht.TeamID
  JOIN School  hs  ON ht.SchoolID  = hs.SchoolID
  JOIN Team    awt ON g.AwayTeamID = awt.TeamID
  JOIN School  as2 ON awt.SchoolID = as2.SchoolID
  JOIN Stadium st  ON g.StadiumID  = st.StadiumID
`;

router.get('/', protect, async (req, res) => {
  const pool = await getPool();
  let query = gameSelect;
  const request = pool.request();
  if (req.user.Role !== 'CNSA_ADMIN') {
    query += ' WHERE ht.SchoolID = @schoolId OR awt.SchoolID = @schoolId';
    request.input('schoolId', sql.Int, req.user.SchoolID);
  }
  query += ' ORDER BY g.GameDate DESC';
  res.json((await request.query(query)).recordset);
});

router.get('/:id', protect, async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(gameSelect + ' WHERE g.GameID = @id');
  if (!result.recordset[0]) return res.status(404).json({ message: 'Game not found' });

  const stats = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`SELECT gs.*, p.FirstName, p.LastName, pos.PositionName
            FROM GameStats gs
            JOIN Player p ON gs.PlayerID = p.PlayerID
            LEFT JOIN Position pos ON gs.PositionID = pos.PositionID
            WHERE gs.GameID = @id`);

  res.json({ ...result.recordset[0], playerStats: stats.recordset });
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Game'), async (req, res) => {
  const { homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore, awayTeamScore, attendance } = req.body;
  const pool = await getPool();
  const result = await pool.request()
    .input('homeTeamId',    sql.Int,  homeTeamId)
    .input('awayTeamId',    sql.Int,  awayTeamId)
    .input('stadiumId',     sql.Int,  stadiumId)
    .input('gameDate',      sql.Date, gameDate)
    .input('homeTeamScore', sql.Int,  homeTeamScore || 0)
    .input('awayTeamScore', sql.Int,  awayTeamScore || 0)
    .input('attendance',    sql.Int,  attendance || null)
    .query(`INSERT INTO Game (HomeTeamID, AwayTeamID, StadiumID, GameDate, HomeTeamScore, AwayTeamScore, Attendance)
            OUTPUT INSERTED.GameID
            VALUES (@homeTeamId, @awayTeamId, @stadiumId, @gameDate, @homeTeamScore, @awayTeamScore, @attendance)`);

  const newId = result.recordset[0].GameID;
  const full  = await pool.request().input('id', sql.Int, newId).query(gameSelect + ' WHERE g.GameID = @id');
  res.status(201).json(full.recordset[0]);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Game'), async (req, res) => {
  const { homeTeamId, awayTeamId, stadiumId, gameDate, homeTeamScore, awayTeamScore, attendance } = req.body;
  const pool = await getPool();
  await pool.request()
    .input('id',            sql.Int,  req.params.id)
    .input('homeTeamId',    sql.Int,  homeTeamId)
    .input('awayTeamId',    sql.Int,  awayTeamId)
    .input('stadiumId',     sql.Int,  stadiumId)
    .input('gameDate',      sql.Date, gameDate)
    .input('homeTeamScore', sql.Int,  homeTeamScore || 0)
    .input('awayTeamScore', sql.Int,  awayTeamScore || 0)
    .input('attendance',    sql.Int,  attendance || null)
    .query(`UPDATE Game SET HomeTeamID=@homeTeamId, AwayTeamID=@awayTeamId, StadiumID=@stadiumId,
            GameDate=@gameDate, HomeTeamScore=@homeTeamScore, AwayTeamScore=@awayTeamScore,
            Attendance=@attendance WHERE GameID=@id`);

  const full = await pool.request().input('id', sql.Int, req.params.id).query(gameSelect + ' WHERE g.GameID = @id');
  res.json(full.recordset[0]);
});

module.exports = router;
