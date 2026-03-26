const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  positionName: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Position', positionSchema);
