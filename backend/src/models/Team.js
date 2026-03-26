const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  coachId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
  season:   { type: String, required: true },
  gender:   { type: String, enum: ['Men', 'Women', 'Mixed'], required: true },
  players:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
