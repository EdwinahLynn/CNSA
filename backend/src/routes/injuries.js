const router = require('express').Router();
const Injury = require('../models/Injury');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  let injuries = await Injury.find()
    .populate('playerId', 'firstName lastName schoolId')
    .populate('gameId', 'gameDate');

  if (req.user.role !== 'CNSA_ADMIN') {
    injuries = injuries.filter(i => i.playerId?.schoolId?.toString() === req.user.schoolId?.toString());
  }
  res.json(injuries);
});

router.get('/:id', protect, async (req, res) => {
  const injury = await Injury.findById(req.params.id).populate('playerId').populate('gameId');
  if (!injury) return res.status(404).json({ message: 'Injury not found' });
  res.json(injury);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'Injury'), async (req, res) => {
  if (req.user.role !== 'CNSA_ADMIN') {
    const player = await Player.findById(req.body.playerId);
    if (!player || player.schoolId.toString() !== req.user.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }
  const injury = await Injury.create(req.body);
  res.status(201).json(injury);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Injury'), async (req, res) => {
  const injury = await Injury.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!injury) return res.status(404).json({ message: 'Injury not found' });
  res.json(injury);
});

module.exports = router;
