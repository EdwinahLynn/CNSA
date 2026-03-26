const mongoose = require('mongoose');

const injurySchema = new mongoose.Schema({
  playerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  gameId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  injuryStatus:   { type: String, enum: ['New', 'From this soccer season', 'From previous'], required: true },
  injuryCause:    { type: String },
  injuryLocation: { type: String },
  surfaceType:    { type: String, enum: ['Indoor', 'Outdoor'] },
  notes:          { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Injury', injurySchema);
