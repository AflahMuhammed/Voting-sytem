const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  // ✅ EXISTING FIELDS
  name: { 
    type: String, 
    required: true 
  },
  
  description: { 
    type: String 
  },
  
  electionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Election', 
    required: true 
  },
  
  isApproved: { 
    type: Boolean, 
    default: true 
  },
  
  votesCount: { 
    type: Number, 
    default: 0 
  },

  // 🆕 NEW FIELDS FOR MEMBER 2
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default: '64a1b2c3d4e5f67890123456' // Default to test user
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Set to approved for backward compatibility
  },
  
  nominationDate: { 
    type: Date, 
    default: Date.now 
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvalDate: { 
    type: Date 
  },
  
  rejectionReason: { 
    type: String 
  },
  
  // 🆕 Additional candidate fields
  photo: {
    type: String, // URL to candidate photo
    default: null
  },
  
  manifesto: {
    type: String, // Detailed candidate platform
    default: ''
  },
  
  contactEmail: {
    type: String
  },
  
  tags: [{
    type: String
  }]

}, { timestamps: true });

// 🆕 NEW METHOD: Check if candidate is active
CandidateSchema.methods.isActive = function() {
  return this.status === 'approved' && this.isApproved;
};

// 🆕 STATIC METHOD: Find approved candidates for election
CandidateSchema.statics.findApprovedForElection = function(electionId) {
  return this.find({
    electionId,
    status: 'approved',
    isApproved: true
  });
};

module.exports = mongoose.model('Candidate', CandidateSchema);