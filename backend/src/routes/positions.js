const router = require('express').Router();
const Position = require('../models/Position');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => res.json(await Position.find()));

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  res.status(201).json(await Position.create(req.body));
});

module.exports = router;
