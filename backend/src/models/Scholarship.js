const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  playerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  scholarshipName:  { type: String, required: true },
  scholarshipAmount:{ type: Number },
  dateAwarded:      { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
