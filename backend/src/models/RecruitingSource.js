const mongoose = require('mongoose');

const recruitingSourceSchema = new mongoose.Schema({
  sourceName: { type: String, required: true },
  sourceType: {
    type: String,
    required: true,
    enum: ['High School', 'Club', 'Provincial', 'College']
  }
});

module.exports = mongoose.model('RecruitingSource', recruitingSourceSchema);
