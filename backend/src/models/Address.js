const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  postalCode: { type: String, required: true, unique: true, uppercase: true },
  cityName:   { type: String, required: true },
  provinceName: { type: String, required: true }
});

module.exports = mongoose.model('Address', addressSchema);
