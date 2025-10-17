const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election'
  },
  type: {
    type: String,
    enum: ['registration', 'candidate_approval', 'candidate_rejection', 'vote_confirmation', 'election_reminder', 'results_published'],
    required: true
  },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  errorMessage: { type: String },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', EmailLogSchema);