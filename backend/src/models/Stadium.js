const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
  stadiumName:     { type: String, required: true },
  streetAddress:   { type: String, required: true },
  postalCode:      { type: String, required: true, uppercase: true },
  cityName:        { type: String, required: true },
  provinceName:    { type: String, required: true },
  stadiumCapacity: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Stadium', stadiumSchema);
