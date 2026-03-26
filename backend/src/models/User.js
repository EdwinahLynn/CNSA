const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['CNSA_ADMIN', 'SCHOOL_ADMIN', 'COACH'];

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, required: true, enum: ROLES },
  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_, obj) => { delete obj.passwordHash; return obj; }
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
