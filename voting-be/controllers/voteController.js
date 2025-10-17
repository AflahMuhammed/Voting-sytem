const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

const voteController = {
  // 🗳️ Get candidates for voting
  getCandidates: async (req, res) => {
    try {
      const { electionId } = req.params;
      const userId = req.user.id;
      
      // Check if election exists and is active
      const election = await Election.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      // Check if voting period is active
      if (!election.isVotingActive()) {
        return res.status(400).json({ message: 'Voting is not currently active for this election' });
      }

      // Check if user has already voted
      const hasVoted = await Vote.findOne({ userId, electionId });
      if (hasVoted) {
        return res.status(400).json({ 
          message: 'You have already voted in this election',
          hasVoted: true 
        });
      }

      // Get approved candidates
      const candidates = await Candidate.find({ 
        electionId, 
        isApproved: true 
      }).select('name description _id votesCount');

      res.json({
        election: { 
          title: election.title, 
          _id: election._id,
          startDate: election.startDate,
          endDate: election.endDate 
        },
        candidates,
        hasVoted: false
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // ✅ Check voting status
  hasVoted: async (req, res) => {
    try {
      const { electionId } = req.params;
      const userId = req.user.id;

      const existingVote = await Vote.findOne({ userId, electionId });
      
      res.json({ 
        hasVoted: !!existingVote,
        voteId: existingVote?._id 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // 🎯 CAST VOTE - YOUR MAIN FUNCTION
  castVote: async (req, res) => {
    try {
      const { electionId, candidateId } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!electionId || !candidateId) {
        return res.status(400).json({ 
          message: 'Election ID and Candidate ID are required' 
        });
      }

      // Check if user exists and is active
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return res.status(403).json({ message: 'User account is not active' });
      }

      // Check if election exists and is active
      const election = await Election.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      // 🕐 Check if voting period is active
      if (!election.isVotingActive()) {
        return res.status(400).json({ 
          message: 'Voting period has ended or not started yet' 
        });
      }

      // Check if candidate exists and belongs to this election
      const candidate = await Candidate.findOne({
        _id: candidateId,
        electionId,
        isApproved: true
      });

      if (!candidate) {
        return res.status(404).json({ 
          message: 'Candidate not found or not approved for this election' 
        });
      }

      // 🚫 Check if user has already voted (double check)
      const existingVote = await Vote.findOne({ userId, electionId });
      if (existingVote) {
        return res.status(409).json({ 
          message: 'You have already voted in this election',
          voteId: existingVote._id 
        });
      }

      // ✅ Create the vote
      const vote = new Vote({
        userId,
        electionId,
        candidateId
      });

      await vote.save();

      // 📈 Update candidate's vote count
      await Candidate.findByIdAndUpdate(candidateId, {
        $inc: { votesCount: 1 }
      });

      // 📈 Update election's total votes
      await Election.findByIdAndUpdate(electionId, {
        $inc: { totalVotes: 1 }
      });

      res.status(201).json({ 
        message: '✅ Vote cast successfully!',
        voteId: vote._id,
        candidateName: candidate.name,
        timestamp: vote.timestamp
      });

    } catch (error) {
      // Handle duplicate vote error (MongoDB unique constraint)
      if (error.code === 11000) {
        return res.status(409).json({ 
          message: 'You have already voted in this election' 
        });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // 🔄 Get voting results (for real-time updates)
  getResults: async (req, res) => {
    try {
      const { electionId } = req.params;

      const results = await Candidate.aggregate([
        { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
        {
          $lookup: {
            from: 'votes',
            localField: '_id',
            foreignField: 'candidateId',
            as: 'votes'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            votesCount: 1,
            totalVotes: { $size: '$votes' }
          }
        }
      ]);

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

module.exports = voteController;