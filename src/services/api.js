// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Mock data for when backend is unavailable
const mockElections = [
  {
    _id: '64a1b2c3d4e5f67890123456',
    title: 'Student Council Election 2024',
    description: 'Annual student council election - Vote for your representatives',
    status: 'active',
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
    status: 'active',
    votingStatus: 'active',
    totalVotes: 89,
    endDate: '2024-06-30T23:59:59.999Z',
    startDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const mockCandidates = {
  '64a1b2c3d4e5f67890123456': [
    {
      _id: 'candidate_001',
      name: 'Alice Johnson',
      description: 'Computer Science Major - Focus on student advocacy and tech resources',
      electionId: '64a1b2c3d4e5f67890123456',
      votes: 45,
      status: 'approved'
    },
    {
      _id: 'candidate_002',
      name: 'Bob Smith',
      description: 'Business Administration - Focus on career development and internships',
      electionId: '64a1b2c3d4e5f67890123456',
      votes: 38,
      status: 'approved'
    }
  ]
};

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth headers
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.email) {
      config.headers['user-email'] = user.email;
    }
    
    if (user.id) {
      config.headers['user-id'] = user.id;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API endpoints
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.log('Using mock login data');
      // Mock login for demo
      if (credentials.email === 'admin@votingapp.com' && credentials.password === 'admin123') {
        return { 
          data: { 
            success: true, 
            user: {
              id: 'admin_001',
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@votingapp.com',
              role: 'admin'
            }
          } 
        };
      }
      return { 
        data: { 
          success: true, 
          user: {
            id: 'student_001',
            firstName: 'Demo',
            lastName: 'Student',
            email: credentials.email,
            role: 'student'
          }
        } 
      };
    }
  },
  
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response;
    } catch (error) {
      console.log('Using mock signup data');
      return { 
        data: { 
          success: true, 
          message: 'User registered successfully (Mock)',
          user: {
            id: 'student_' + Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: 'student'
          }
        } 
      };
    }
  },
};

// Admin API endpoints with mock data
export const adminAPI = {
  // Election management
  createElection: async (electionData) => {
    try {
      const response = await api.post('/admin/elections', electionData);
      return response;
    } catch (error) {
      console.log('Using mock election creation');
      const newElection = {
        _id: `election_${Date.now()}`,
        ...electionData,
        status: 'active',
        totalVotes: 0,
        createdAt: new Date().toISOString()
      };
      return { data: { election: newElection, success: true } };
    }
  },
  
  getAllElections: async () => {
    try {
      const response = await api.get('/admin/elections');
      return response;
    } catch (error) {
      console.log('Using mock admin elections');
      return { data: { elections: mockElections, success: true } };
    }
  },
  
  updateElection: async (electionId, electionData) => {
    try {
      const response = await api.put(`/admin/elections/${electionId}`, electionData);
      return response;
    } catch (error) {
      console.log('Using mock election update');
      return { data: { success: true, message: 'Election updated (Mock)' } };
    }
  },
  
  deleteElection: async (electionId) => {
    try {
      const response = await api.delete(`/admin/elections/${electionId}`);
      return response;
    } catch (error) {
      console.log('Using mock election deletion');
      return { data: { success: true, message: 'Election deleted (Mock)' } };
    }
  },
  
  // ADD THIS MISSING FUNCTION
  endElection: async (electionId) => {
    try {
      // Update election status to 'ended'
      const response = await api.put(`/admin/elections/${electionId}`, { status: 'ended' });
      return response;
    } catch (error) {
      console.log('Using mock election end');
      return { data: { success: true, message: 'Election ended (Mock)' } };
    }
  },
  
  // Candidate management
  addCandidate: async (candidateData) => {
    try {
      const response = await api.post('/admin/candidates', candidateData);
      return response;
    } catch (error) {
      console.log('Using mock candidate creation');
      const newCandidate = {
        _id: `candidate_${Date.now()}`,
        ...candidateData,
        votes: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      return { data: { candidate: newCandidate, success: true } };
    }
  },
  
  getCandidates: async () => {
    try {
      const response = await api.get('/admin/candidates');
      return response;
    } catch (error) {
      console.log('Using mock candidates data');
      return { data: { candidates: Object.values(mockCandidates).flat(), success: true } };
    }
  },
  
  getElectionCandidates: async (electionId) => {
    try {
      const response = await api.get(`/votes/elections/${electionId}/candidates`);
      return response;
    } catch (error) {
      console.log('Using mock election candidates data');
      const candidates = mockCandidates[electionId] || [];
      return { data: { candidates, success: true } };
    }
  },
  
  updateCandidate: async (candidateId, candidateData) => {
    try {
      const response = await api.put(`/admin/candidates/${candidateId}`, candidateData);
      return response;
    } catch (error) {
      console.log('Using mock candidate update');
      return { data: { success: true, message: 'Candidate updated (Mock)' } };
    }
  },
  
  deleteCandidate: async (candidateId) => {
    try {
      const response = await api.delete(`/admin/candidates/${candidateId}`);
      return response;
    } catch (error) {
      console.log('Using mock candidate deletion');
      return { data: { success: true, message: 'Candidate deleted (Mock)' } };
    }
  },
  
  // User management
  getUsers: async () => {
    try {
      const response = await api.get('/admin/students');
      return response;
    } catch (error) {
      console.log('Using mock students data');
      const mockStudents = [
        {
          _id: 'student_001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@student.edu',
          collegeId: 'STU001',
          role: 'student',
          isActive: true,
          votesCast: 2,
          joinedDate: new Date().toISOString()
        },
        {
          _id: 'student_002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@student.edu',
          collegeId: 'STU002',
          role: 'student',
          isActive: true,
          votesCast: 1,
          joinedDate: new Date().toISOString()
        }
      ];
      return { data: { students: mockStudents, success: true } };
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/students/${userId}`, userData);
      return response;
    } catch (error) {
      console.log('Using mock user update');
      return { data: { success: true, message: 'User updated (Mock)' } };
    }
  },
  
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/students/${userId}`);
      return response;
    } catch (error) {
      console.log('Using mock user deletion');
      return { data: { success: true, message: 'User deleted (Mock)' } };
    }
  },
  
  updateUserStatus: async (userId, status) => {
    try {
      const response = await api.put(`/admin/students/${userId}`, { isActive: status === 'active' });
      return response;
    } catch (error) {
      console.log('Using mock user status update');
      return { data: { success: true, message: 'User status updated (Mock)' } };
    }
  },
  
  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await api.put(`/admin/students/${userId}`, { password: newPassword });
      return response;
    } catch (error) {
      console.log('Using mock password reset');
      return { data: { success: true, message: 'Password reset (Mock)' } };
    }
  }
};

// Voting API endpoints with fallback to mock data
export const votingAPI = {
  // Get active elections for students
  getActiveElections: async () => {
    try {
      const response = await api.get('/student/elections');
      return response;
    } catch (error) {
      console.log('Using mock elections data');
      return { data: mockElections };
    }
  },
  
  // Get candidates for election
  getCandidates: async (electionId) => {
    try {
      const response = await api.get(`/votes/elections/${electionId}/candidates`);
      return response;
    } catch (error) {
      console.log('Using mock candidates data');
      const candidates = mockCandidates[electionId] || [];
      return { 
        data: { 
          success: true,
          candidates 
        } 
      };
    }
  },
  
  // Cast vote
  castVote: async (voteData) => {
    try {
      const response = await api.post('/votes/cast', voteData);
      return response;
    } catch (error) {
      console.log('Using mock vote casting');
      return { 
        data: { 
          success: true, 
          message: 'Vote cast successfully! (Mock)'
        } 
      };
    }
  },
  
  // Get results
  getResults: async (electionId) => {
    try {
      const response = await api.get(`/votes/elections/${electionId}/results`);
      return response;
    } catch (error) {
      console.log('Using mock results data');
      const mockResults = {
        electionId,
        electionTitle: mockElections.find(e => e._id === electionId)?.title || 'Unknown Election',
        totalVotes: 150,
        candidates: mockCandidates[electionId]?.map(c => ({
          ...c,
          percentage: Math.round((c.votes / 150) * 100)
        })) || []
      };
      return { data: mockResults };
    }
  },
  
  // Check if user has voted
  checkVoteStatus: async (electionId) => {
    try {
      const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      return { data: { hasVoted: !!userVotes[electionId] } };
    } catch (error) {
      return { data: { hasVoted: false } };
    }
  },
  
  // Get user's voting history
  getUserVotes: async () => {
    try {
      const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
      return { data: Object.values(userVotes) };
    } catch (error) {
      return { data: [] };
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response;
  } catch (error) {
    console.log('Health check failed - backend not available');
    return { data: { status: 'Backend not available - using mock data' } };
  }
};

export default api;