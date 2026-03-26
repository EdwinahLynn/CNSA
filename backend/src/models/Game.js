const mongoose = require('mongoose');

const playerStatSchema = new mongoose.Schema({
  playerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  positionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Position' },
  goals:       { type: Number, default: 0 },
  assists:     { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards:    { type: Number, default: 0 }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  homeTeamId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeamId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  stadiumId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true },
  gameDate:       { type: Date, required: true },
  homeTeamScore:  { type: Number, default: 0 },
  awayTeamScore:  { type: Number, default: 0 },
  attendance:     { type: Number },
  playerStats:    [playerStatSchema]
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
