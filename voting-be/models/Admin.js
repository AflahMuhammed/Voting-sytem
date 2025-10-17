const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    canManageElections: { type: Boolean, default: true },
    canApproveCandidates: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);