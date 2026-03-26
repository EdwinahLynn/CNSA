const router = require('express').Router();
const Scholarship = require('../models/Scholarship');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

router.get('/', protect, async (req, res) => {
  let scholarships = await Scholarship.find()
    .populate({ path: 'playerId', select: 'firstName lastName schoolId', populate: { path: 'schoolId', select: 'schoolName' } });

  if (req.user.role !== 'CNSA_ADMIN') {
    scholarships = scholarships.filter(s => s.playerId?.schoolId?._id.toString() === req.user.schoolId?.toString());
  }
  res.json(scholarships);
});

router.post('/', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('CREATE', 'Scholarship'), async (req, res) => {
  if (req.user.role !== 'CNSA_ADMIN') {
    const player = await Player.findById(req.body.playerId);
    if (!player || player.schoolId.toString() !== req.user.schoolId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }
  const scholarship = await Scholarship.create(req.body);
  res.status(201).json(scholarship);
});

router.put('/:id', protect, authorize('CNSA_ADMIN', 'SCHOOL_ADMIN'), auditAction('UPDATE', 'Scholarship'), async (req, res) => {
  const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json(scholarship);
});

module.exports = router;
