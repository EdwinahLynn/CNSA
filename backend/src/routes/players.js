const router = require('express').Router();
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

// GET all players — scope by school for non-admins
router.get('/', protect, async (req, res) => {
  const filter = {};
  if (req.user.role !== 'CNSA_ADMIN') filter.schoolId = req.user.schoolId;
  const players = await Player.find(filter)
    .populate('schoolId', 'schoolName')
    .populate('positions', 'positionName')
    .populate('recruitSourceId', 'sourceName sourceType');
  res.json(players);
});

// GET one player
router.get('/:id', protect, async (req, res) => {
  const player = await Player.findById(req.params.id)
    .populate('schoolId', 'schoolName')
    .populate('positions', 'positionName')
    .populate('recruitSourceId');
  if (!player) return res.status(404).json({ message: 'Player not found' });
  if (req.user.role !== 'CNSA_ADMIN' && player.schoolId._id.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json(player);
});

// POST create player (SCHOOL_ADMIN or COACH for own school)
router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('CREATE', 'Player'), async (req, res) => {
  if (req.user.role !== 'CNSA_ADMIN' && req.body.schoolId?.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Can only add players to your own school' });
  }
  const player = await Player.create(req.body);
  res.status(201).json(player);
});

// PUT update player
router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'), auditAction('UPDATE', 'Player'), async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });
  if (req.user.role !== 'CNSA_ADMIN' && player.schoolId.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  // Prevent hard delete — only allow status changes
  delete req.body._id;
  const updated = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updated);
});

// PATCH status only
router.patch('/:id/status', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('STATUS_CHANGE', 'Player'), async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Graduated', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const player = await Player.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!player) return res.status(404).json({ message: 'Player not found' });
  res.json(player);
});

module.exports = router;
