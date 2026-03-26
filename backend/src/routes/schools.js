const router = require('express').Router();
const School = require('../models/School');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { auditAction } = require('../middleware/audit');

// GET all schools
router.get('/', protect, async (req, res) => {
  const schools = await School.find();
  res.json(schools);
});

// GET one school
router.get('/:id', protect, async (req, res) => {
  const school = await School.findById(req.params.id);
  if (!school) return res.status(404).json({ message: 'School not found' });
  res.json(school);
});

// POST create school (CNSA_ADMIN only)
router.post('/', protect, authorize('CNSA_ADMIN'), auditAction('CREATE', 'School'), async (req, res) => {
  const school = await School.create(req.body);
  res.status(201).json(school);
});

// PUT update school (CNSA_ADMIN only)
router.put('/:id', protect, authorize('CNSA_ADMIN'), auditAction('UPDATE', 'School'), async (req, res) => {
  const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!school) return res.status(404).json({ message: 'School not found' });
  res.json(school);
});

module.exports = router;
