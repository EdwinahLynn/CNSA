const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  firstName:        { type: String, required: true },
  lastName:         { type: String, required: true },
  sex:              { type: String, enum: ['M', 'F', 'O'], required: true },
  phoneNumber:      { type: String },
  email:            { type: String },
  streetAddress:    { type: String, required: true },
  postalCode:       { type: String, required: true, uppercase: true },
  cityName:         { type: String, required: true },
  provinceName:     { type: String, required: true },
  schoolId:         { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  status:           { type: String, enum: ['Active', 'Graduated', 'Inactive'], default: 'Active' },
  recruitingRank:   { type: Number },
  highSchool:       { type: String },
  recruitSourceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitingSource' },
  positions:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Position' }],
  recruitingIncidents: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
