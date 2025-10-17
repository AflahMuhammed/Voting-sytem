// routes/votes.js
const express = require('express');
const router = express.Router();

// ✅ GET ACTIVE ELECTIONS - This is the main endpoint your dashboard needs
router.get('/elections/active', (req, res) => {
  res.json([
    {
      _id: '64a1b2c3d4e5f67890123456',
      title: 'Student Council Election 2024',
      description: 'Annual student council election - Vote for your representatives',
      status: 'published',
      votingStatus: 'active',
      totalVotes: 150,
      endDate: '2024-12-31T23:59:59.999Z',
      startDate: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '64a1b2c3d4e5f67890123457',
      title: 'Sports Committee Election 2024',
      description: 'Elect your sports committee representatives',
      status: 'published',
      votingStatus: 'upcoming',
      totalVotes: 0,
      endDate: '2024-12-15T23:59:59.999Z',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '64a1b2c3d4e5f67890123458',
      title: 'Cultural Festival Committee 2024',
      description: 'Select organizers for the annual cultural festival',
      status: 'published',
      votingStatus: 'active',
      totalVotes: 89,
      endDate: '2024-11-30T23:59:59.999Z',
      startDate: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);
});

// ✅ GET USER'S VOTING HISTORY
router.get('/user/votes', (req, res) => {
  res.json([
    {
      _id: 'vote_001',
      electionId: {
        _id: '64a1b2c3d4e5f67890123456',
        title: 'Student Council Election 2024'
      },
      candidateId: {
        _id: 'candidate_001',
        name: 'Alice Johnson'
      },
      timestamp: new Date().toISOString(),
      votedAt: new Date().toISOString()
    }
  ]);
});

// ✅ GET CANDIDATES FOR SPECIFIC ELECTION
router.get('/elections/:electionId/candidates', (req, res) => {
  const { electionId } = req.params;
  
  const candidatesData = {
    '64a1b2c3d4e5f67890123456': [
      {
        _id: 'candidate_001',
        name: 'Alice Johnson',
        description: 'Computer Science Major - Focus on student advocacy and tech resources',
        electionId: electionId,
        votes: 45,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'candidate_002',
        name: 'Bob Smith',
        description: 'Business Administration - Focus on career development and internships',
        electionId: electionId,
        votes: 38,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'candidate_003',
        name: 'Carol Davis',
        description: 'Political Science - Focus on student rights and campus improvements',
        electionId: electionId,
        votes: 32,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'candidate_004',
        name: 'David Wilson',
        description: 'Environmental Science - Focus on sustainability and green campus',
        electionId: electionId,
        votes: 25,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ],
    '64a1b2c3d4e5f67890123457': [
      {
        _id: 'candidate_005',
        name: 'Emma Thompson',
        description: 'Athletics Department - Former basketball team captain',
        electionId: electionId,
        votes: 0,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'candidate_006',
        name: 'Frank Miller',
        description: 'Sports Science - Focus on intramural sports programs',
        electionId: electionId,
        votes: 0,
        photo: null,
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const candidates = candidatesData[electionId] || [];
  res.json({
    electionId: electionId,
    candidates: candidates,
    totalCandidates: candidates.length
  });
});

// ✅ CHECK IF USER HAS ALREADY VOTED
router.get('/elections/:electionId/has-voted', (req, res) => {
  const { electionId } = req.params;
  
  // For demo purposes - in real app, check database
  const hasVoted = Math.random() > 0.7; // 30% chance user has voted
  
  res.json({
    hasVoted: hasVoted,
    electionId: electionId,
    message: hasVoted ? 'User has already voted in this election' : 'User can vote'
  });
});

// ✅ CAST A VOTE
router.post('/cast', (req, res) => {
  const { electionId, candidateId } = req.body;
  
  console.log('📩 Vote received:', { electionId, candidateId });
  
  // Validate request
  if (!electionId || !candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Missing electionId or candidateId'
    });
  }

  // Simulate vote processing
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Vote cast successfully!',
      voteId: `vote_${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        electionId: electionId,
        candidateId: candidateId,
        votedAt: new Date().toISOString()
      }
    });
  }, 1000); // Simulate processing delay
});

// ✅ GET LIVE ELECTION RESULTS
router.get('/elections/:electionId/results', (req, res) => {
  const { electionId } = req.params;
  
  const resultsData = {
    '64a1b2c3d4e5f67890123456': {
      electionId: electionId,
      electionTitle: 'Student Council Election 2024',
      totalVotes: 150,
      candidates: [
        {
          _id: 'candidate_001',
          name: 'Alice Johnson',
          description: 'Computer Science Major',
          votes: 67,
          percentage: 44.7
        },
        {
          _id: 'candidate_002',
          name: 'Bob Smith',
          description: 'Business Administration',
          votes: 45,
          percentage: 30.0
        },
        {
          _id: 'candidate_003',
          name: 'Carol Davis',
          description: 'Political Science',
          votes: 25,
          percentage: 16.7
        },
        {
          _id: 'candidate_004',
          name: 'David Wilson',
          description: 'Environmental Science',
          votes: 13,
          percentage: 8.6
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    '64a1b2c3d4e5f67890123457': {
      electionId: electionId,
      electionTitle: 'Sports Committee Election 2024',
      totalVotes: 0,
      candidates: [
        {
          _id: 'candidate_005',
          name: 'Emma Thompson',
          description: 'Athletics Department',
          votes: 0,
          percentage: 0
        },
        {
          _id: 'candidate_006',
          name: 'Frank Miller',
          description: 'Sports Science',
          votes: 0,
          percentage: 0
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  };

  const results = resultsData[electionId] || {
    electionId: electionId,
    electionTitle: 'Unknown Election',
    totalVotes: 0,
    candidates: [],
    lastUpdated: new Date().toISOString()
  };

  res.json(results);
});

// ✅ GET ALL ELECTIONS (including inactive)
router.get('/elections', (req, res) => {
  res.json({
    elections: [
      {
        _id: '64a1b2c3d4e5f67890123456',
        title: 'Student Council Election 2024',
        description: 'Annual student council election',
        status: 'published',
        votingStatus: 'active',
        totalVotes: 150,
        startDate: new Date().toISOString(),
        endDate: '2024-12-31T23:59:59.999Z',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: '64a1b2c3d4e5f67890123457',
        title: 'Sports Committee Election 2024',
        description: 'Elect sports committee representatives',
        status: 'published',
        votingStatus: 'upcoming',
        totalVotes: 0,
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: '2024-12-15T23:59:59.999Z',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        _id: '64a1b2c3d4e5f67890123459',
        title: 'Graduation Committee 2023',
        description: '2023 Graduation ceremony committee',
        status: 'published',
        votingStatus: 'completed',
        totalVotes: 245,
        startDate: '2023-04-01T00:00:00.000Z',
        endDate: '2023-05-31T23:59:59.999Z',
        isActive: false,
        createdAt: '2023-03-15T00:00:00.000Z'
      }
    ],
    total: 3,
    active: 2,
    completed: 1
  });
});

// ✅ TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Votes API is working! 🎉',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/votes/elections/active',
      'GET /api/votes/elections/:id/candidates',
      'GET /api/votes/elections/:id/has-voted',
      'POST /api/votes/cast',
      'GET /api/votes/elections/:id/results',
      'GET /api/votes/user/votes'
    ]
  });
});

module.exports = router;