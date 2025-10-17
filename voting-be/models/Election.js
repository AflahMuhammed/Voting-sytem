const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  // ✅ EXISTING FIELDS (Keep these)
  title: { 
    type: String,        
    required: true       
  },
  
  description: { 
    type: String         
  },
  
  startDate: { 
    type: Date,          
    required: true       
  },
  
  endDate: { 
    type: Date,          
    required: true       
  },
  
  isActive: { 
    type: Boolean,       
    default: true        
  },
  
  votingStatus: { 
    type: String,                               
    enum: ['upcoming', 'active', 'completed'],  
    default: 'upcoming'                         
  },
  
  totalVotes: { 
    type: Number,        
    default: 0           
  },
  
  // 🆕 NEW FIELDS FOR MEMBER 2 INTEGRATION
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default: '64a1b2c3d4e5f67890123456' // Default to your test user ID
  },
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published' // Changed from 'draft' to 'published' for backward compatibility
  },
  
  settings: {
    allowCandidateRegistration: { 
      type: Boolean, 
      default: true 
    },
    requireCandidateApproval: { 
      type: Boolean, 
      default: false // Changed to false so existing candidates work
    },
    maxCandidates: { 
      type: Number, 
      default: 10 
    },
    votingMethod: {
      type: String,
      enum: ['first-past-the-post', 'ranked-choice'],
      default: 'first-past-the-post'
    }
  },
  
  // 🆕 Additional admin fields
  location: {
    type: String,
    default: 'Main Campus'
  },
  
  eligibleVoters: {
    type: Number,
    default: 500
  },
  
  tags: [{
    type: String
  }]

}, { timestamps: true });

// ✅ KEEP YOUR EXISTING METHOD (but enhance it)
ElectionSchema.methods.isVotingActive = function() {
  const now = new Date();
  
  // Enhanced check with new status field
  return this.startDate <= now && 
         this.endDate >= now && 
         this.isActive && 
         this.status === 'published' && // Added status check
         this.votingStatus === 'active'; // Added votingStatus check
};

// 🆕 NEW METHOD: Check if candidate registration is open
ElectionSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  const registrationDeadline = new Date(this.startDate);
  registrationDeadline.setDate(registrationDeadline.getDate() - 1); // Close 1 day before voting starts
  
  return now <= registrationDeadline && 
         this.settings.allowCandidateRegistration &&
         this.status === 'published';
};

// 🆕 NEW METHOD: Get election progress percentage
ElectionSchema.methods.getProgressPercentage = function() {
  const now = new Date();
  const totalDuration = this.endDate - this.startDate;
  const elapsed = now - this.startDate;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
};

// 🆕 STATIC METHOD: Find active elections
ElectionSchema.statics.findActiveElections = function() {
  const now = new Date();
  return this.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
    status: 'published'
  });
};

// 🆕 STATIC METHOD: Find upcoming elections
ElectionSchema.statics.findUpcomingElections = function() {
  const now = new Date();
  return this.find({
    startDate: { $gt: now },
    isActive: true,
    status: 'published'
  });
};

module.exports = mongoose.model('Election', ElectionSchema);