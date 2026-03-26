const router = require('express').Router();
const Coach = require('../models/Coach');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  const filter = req.user.role !== 'CNSA_ADMIN' ? { schoolId: req.user.schoolId } : {};
  const coaches = await Coach.find(filter).populate('schoolId', 'schoolName');
  res.json(coaches);
});

router.get('/:id', protect, async (req, res) => {
  const coach = await Coach.findById(req.params.id).populate('schoolId', 'schoolName');
  if (!coach) return res.status(404).json({ message: 'Coach not found' });
  res.json(coach);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Coach'), async (req, res) => {
  if (req.user.role !== 'CNSA_ADMIN' && req.body.schoolId?.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Can only add coaches to your own school' });
  }
  const coach = await Coach.create(req.body);
  res.status(201).json(coach);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Coach'), async (req, res) => {
  const coach = await Coach.findById(req.params.id);
  if (!coach) return res.status(404).json({ message: 'Coach not found' });
  if (req.user.role !== 'CNSA_ADMIN' && coach.schoolId.toString() !== req.user.schoolId?.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const updated = await Coach.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(updated);
});

module.exports = router;
