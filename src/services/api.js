// services/api.js - Clean API service with proper exports
const API_BASE_URL = 'http://localhost:5001/api';

// Helper function for API calls
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log(`🔄 API Call: ${endpoint}`, config);
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          data: data || { message: 'Request failed' }
        }
      };
    }

    console.log(`✅ API Success: ${endpoint}`, data);
    return { data };
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error);
    throw error;
  }
};

// Auth API
const authAPI = {
  login: async (credentials) => {
    return await apiRequest('/auth/login', {
      method: 'POST',
      body: credentials
    });
  },

  signup: async (userData) => {
    return await apiRequest('/auth/signup', {
      method: 'POST',
      body: userData
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Admin API
const adminAPI = {
  // Election APIs
  getAllElections: async () => {
    return await apiRequest('/admin/elections');
  },

  createElection: async (electionData) => {
    return await apiRequest('/admin/elections', {
      method: 'POST',
      body: electionData
    });
  },

  endElection: async (electionId) => {
    return await apiRequest(`/admin/elections/${electionId}/end`, {
      method: 'PUT'
    });
  },

  deleteElection: async (electionId) => {
    return await apiRequest(`/admin/elections/${electionId}`, {
      method: 'DELETE'
    });
  },

  // User Management APIs
  getUsers: async () => {
    return await apiRequest('/admin/students');
  },

  deleteUser: async (userId) => {
    return await apiRequest(`/admin/students/${userId}`, {
      method: 'DELETE'
    });
  },

  updateUserStatus: async (userId, status) => {
    return await apiRequest(`/admin/students/${userId}/status`, {
      method: 'PUT',
      body: { status }
    });
  },

  resetUserPassword: async (userId, newPassword) => {
    return await apiRequest(`/admin/students/${userId}/password`, {
      method: 'PUT',
      body: { newPassword }
    });
  },

  // Candidate APIs
  getCandidates: async () => {
    return await apiRequest('/admin/candidates');
  },

  addCandidate: async (candidateData) => {
    return await apiRequest('/admin/candidates', {
      method: 'POST',
      body: candidateData
    });
  },

  deleteCandidate: async (candidateId) => {
    return await apiRequest(`/admin/candidates/${candidateId}`, {
      method: 'DELETE'
    });
  }
};

// Voting API for students
const votingAPI = {
  getActiveElections: async () => {
    return await apiRequest('/student/elections');
  },

  getCandidates: async (electionId) => {
    return await apiRequest(`/votes/elections/${electionId}/candidates`);
  },

  castVote: async (voteData) => {
    return await apiRequest('/votes/cast', {
      method: 'POST',
      body: voteData
    });
  },

  getResults: async (electionId) => {
    return await apiRequest(`/votes/elections/${electionId}/results`);
  },

  getUserVotes: async () => {
    return await apiRequest('/votes/my-votes');
  },

  checkVoteStatus: async (electionId) => {
    return await apiRequest(`/votes/elections/${electionId}/status`);
  }
};

// Legacy API service for backward compatibility
const apiService = {
  // Login with email and password (legacy style)
  login: async (email, password) => {
    return await authAPI.login({ email, password });
  },

  // Signup with user data (legacy style)
  signup: async (userData) => {
    return await authAPI.signup(userData);
  },

  // Other methods for backward compatibility
  getElections: async () => {
    return await votingAPI.getActiveElections();
  },

  getElectionCandidates: async (electionId) => {
    return await votingAPI.getCandidates(electionId);
  },

  submitVote: async (voteData) => {
    return await votingAPI.castVote(voteData);
  },

  getElectionResults: async (electionId) => {
    return await votingAPI.getResults(electionId);
  }
};

// Export everything in a single export statement
export {
  authAPI,
  adminAPI,
  votingAPI
};

export default apiService;