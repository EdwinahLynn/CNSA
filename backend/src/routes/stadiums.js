const router = require('express').Router();
const Stadium = require('../models/Stadium');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => {
  res.json(await Stadium.find());
});

router.get('/:id', protect, async (req, res) => {
  const s = await Stadium.findById(req.params.id);
  if (!s) return res.status(404).json({ message: 'Stadium not found' });
  res.json(s);
});

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  res.status(201).json(await Stadium.create(req.body));
});

router.put('/:id', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  const s = await Stadium.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!s) return res.status(404).json({ message: 'Stadium not found' });
  res.json(s);
});

module.exports = router;
