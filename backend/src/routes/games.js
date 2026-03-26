const router = require('express').Router();
const Game = require('../models/Game');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  let games = await Game.find()
    .populate({ path: 'homeTeamId', populate: { path: 'schoolId', select: 'schoolName' } })
    .populate({ path: 'awayTeamId', populate: { path: 'schoolId', select: 'schoolName' } })
    .populate('stadiumId', 'stadiumName cityName');

  if (req.user.role !== 'CNSA_ADMIN') {
    games = games.filter(g =>
      g.homeTeamId?.schoolId?._id.toString() === req.user.schoolId?.toString() ||
      g.awayTeamId?.schoolId?._id.toString() === req.user.schoolId?.toString()
    );
  }
  res.json(games);
});

router.get('/:id', protect, async (req, res) => {
  const game = await Game.findById(req.params.id)
    .populate({ path: 'homeTeamId', populate: { path: 'schoolId', select: 'schoolName' } })
    .populate({ path: 'awayTeamId', populate: { path: 'schoolId', select: 'schoolName' } })
    .populate('stadiumId')
    .populate('playerStats.playerId', 'firstName lastName')
    .populate('playerStats.positionId', 'positionName');
  if (!game) return res.status(404).json({ message: 'Game not found' });
  res.json(game);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Game'), async (req, res) => {
  const game = await Game.create(req.body);
  res.status(201).json(game);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Game'), async (req, res) => {
  const game = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!game) return res.status(404).json({ message: 'Game not found' });
  res.json(game);
});

module.exports = router;
