const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  type: {
    type: String,
    enum: ['voting_summary', 'candidate_performance', 'voter_turnout', 'audit_log'],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: { type: mongoose.Schema.Types.Mixed },
  fileUrl: { type: String },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf'],
    default: 'json'
  },
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);