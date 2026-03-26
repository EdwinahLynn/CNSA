const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType:      { type: String, required: true },
  affectedEntity:  { type: String, required: true },
  affectedId:      { type: String },
  details:         { type: mongoose.Schema.Types.Mixed },
  timestamp:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
