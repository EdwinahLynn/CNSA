const router = require('express').Router();
const Player = require('../models/Player');
const Game = require('../models/Game');
const Injury = require('../models/Injury');
const Scholarship = require('../models/Scholarship');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// GET /api/reports/audit  — CNSA_ADMIN only
router.get('/audit', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(500)
    .populate('userId', 'username role');
  res.json(logs);
});

// GET /api/reports/players-by-school
router.get('/players-by-school', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const data = await Player.aggregate([
    { $group: { _id: '$schoolId', total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } } } },
    { $lookup: { from: 'schools', localField: '_id', foreignField: '_id', as: 'school' } },
    { $unwind: '$school' },
    { $project: { schoolName: '$school.schoolName', total: 1, active: 1 } }
  ]);
  res.json(data);
});

// GET /api/reports/injuries-summary
router.get('/injuries-summary', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), async (req, res) => {
  const matchFilter = req.user.role !== 'CNSA_ADMIN'
    ? [{ $lookup: { from: 'players', localField: 'playerId', foreignField: '_id', as: 'player' } },
       { $unwind: '$player' },
       { $match: { 'player.schoolId': req.user.schoolId } }]
    : [];

  const pipeline = [
    ...matchFilter,
    { $group: { _id: '$injuryStatus', count: { $sum: 1 } } }
  ];
  res.json(await Injury.aggregate(pipeline));
});

// GET /api/reports/top-scorers
router.get('/top-scorers', protect, async (req, res) => {
  const data = await Game.aggregate([
    { $unwind: '$playerStats' },
    { $group: { _id: '$playerStats.playerId', totalGoals: { $sum: '$playerStats.goals' }, totalAssists: { $sum: '$playerStats.assists' } } },
    { $sort: { totalGoals: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'players', localField: '_id', foreignField: '_id', as: 'player' } },
    { $unwind: '$player' },
    { $project: { firstName: '$player.firstName', lastName: '$player.lastName', totalGoals: 1, totalAssists: 1 } }
  ]);
  res.json(data);
});

module.exports = router;
