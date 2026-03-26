const router = require('express').Router();
const RecruitingSource = require('../models/RecruitingSource');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.get('/', protect, async (req, res) => res.json(await RecruitingSource.find()));

router.post('/', protect, authorize('CNSA_ADMIN'), async (req, res) => {
  res.status(201).json(await RecruitingSource.create(req.body));
});

module.exports = router;
