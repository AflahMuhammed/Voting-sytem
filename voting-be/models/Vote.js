const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  electionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Election', 
    required: true 
  },
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate', 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  ipHash: { type: String } // Optional: for additional security
});

// 🔐 CRITICAL: This ensures one vote per user per election
VoteSchema.index({ userId: 1, electionId: 1 }, { unique: true });

// 🔐 Optional: Additional security index
VoteSchema.index({ electionId: 1, candidateId: 1 });

module.exports = mongoose.model('Vote', VoteSchema);