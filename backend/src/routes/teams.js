const router = require('express').Router();
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  const filter = req.user.role !== 'CNSA_ADMIN' ? { schoolId: req.user.schoolId } : {};
  const teams = await Team.find(filter)
    .populate('schoolId', 'schoolName')
    .populate('coachId', 'firstName lastName')
    .populate('players', 'firstName lastName status');
  res.json(teams);
});

router.get('/:id', protect, async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('schoolId', 'schoolName')
    .populate('coachId', 'firstName lastName')
    .populate('players');
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(team);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Team'), async (req, res) => {
  if (req.user.role !== 'CNSA_ADMIN' && req.body.schoolId?.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Can only create teams for your own school' });
  }
  const team = await Team.create(req.body);
  res.status(201).json(team);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Team'), async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (req.user.role !== 'CNSA_ADMIN' && team.schoolId.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const updated = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updated);
});

module.exports = router;
