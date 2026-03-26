const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  schoolName:       { type: String, required: true },
  schoolPopulation: { type: Number },
  streetAddress:    { type: String, required: true },
  postalCode:       { type: String, required: true, uppercase: true },
  cityName:         { type: String, required: true },
  provinceName:     { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
