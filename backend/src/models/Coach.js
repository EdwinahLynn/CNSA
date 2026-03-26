const mongoose = require('mongoose');

const coachHistorySchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  position:   { type: String, required: true }
}, { _id: false });

const coachSchema = new mongoose.Schema({
  firstName:     { type: String, required: true },
  lastName:      { type: String, required: true },
  sex:           { type: String, enum: ['M', 'F', 'O'], required: true },
  phoneNumber:   { type: String },
  email:         { type: String },
  streetAddress: { type: String, required: true },
  postalCode:    { type: String, required: true, uppercase: true },
  cityName:      { type: String, required: true },
  provinceName:  { type: String, required: true },
  schoolId:      { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  previousSchools: [coachHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Coach', coachSchema);
