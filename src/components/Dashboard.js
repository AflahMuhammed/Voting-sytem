// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { votingAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading dashboard data...');
      
      // Load active elections - FIXED: Handle response structure properly
      const electionsResponse = await votingAPI.getActiveElections();
      console.log('Elections response:', electionsResponse);
      
      // Handle different response structures
      let electionsData = [];
      if (electionsResponse.data && Array.isArray(electionsResponse.data)) {
        // Direct array response
        electionsData = electionsResponse.data;
      } else if (electionsResponse.data && electionsResponse.data.elections) {
        // Response with elections object
        electionsData = electionsResponse.data.elections;
      } else if (electionsResponse.data && electionsResponse.data.success) {
        // Response with success flag
        electionsData = electionsResponse.data.elections || [];
      }
      
      console.log('Processed elections data:', electionsData);
      
      // Load user's voting history
      const votesResponse = await votingAPI.getUserVotes();
      const votesData = Array.isArray(votesResponse.data) ? votesResponse.data : [];
      
      // Check voting status for each election
      const electionsWithStatus = await Promise.all(
        electionsData.map(async (election) => {
          try {
            const voteStatusResponse = await votingAPI.checkVoteStatus(election.id || election._id);
            const hasVoted = voteStatusResponse.data?.hasVoted || false;
            
            // Load candidates if user hasn't voted
            let candidates = [];
            if (!hasVoted) {
              const candidatesResponse = await votingAPI.getCandidates(election.id || election._id);
              candidates = candidatesResponse.data?.candidates || [];
            }
            
            return {
              ...election,
              _id: election._id || election.id, // Ensure _id is available
              hasVoted,
              candidates
            };
          } catch (error) {
            console.error(`Error checking vote status for election ${election.id || election._id}:`, error);
            return {
              ...election,
              _id: election._id || election.id,
              hasVoted: false,
              candidates: []
            };
          }
        })
      );
      
      setElections(electionsWithStatus);
      setUserVotes(votesData);
      console.log('Dashboard data loaded successfully');
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (electionId, candidateId, candidateName) => {
    if (!window.confirm(`Are you sure you want to vote for ${candidateName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await votingAPI.castVote({ 
        electionId, 
        candidateId 
      });
      
      if (response.data.success) {
        // Track vote in localStorage for demo
        const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        userVotes[electionId] = {
          _id: `vote_${Date.now()}`,
          electionId: { _id: electionId, title: elections.find(e => e._id === electionId)?.title },
          candidateId: { _id: candidateId, name: candidateName },
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('userVotes', JSON.stringify(userVotes));
        
        alert('Vote cast successfully!');
        loadDashboardData();
      } else {
        alert(response.data.message || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert(error.response?.data?.message || 'Error casting vote. Please try again.');
    }
  };

  const handleViewResults = async (electionId) => {
    try {
      const response = await votingAPI.getResults(electionId);
      const results = response.data;
      
      // Handle different response structures
      let resultsData = [];
      if (Array.isArray(results)) {
        resultsData = results;
      } else if (results.results) {
        resultsData = results.results;
      } else if (results.candidates) {
        resultsData = results.candidates;
      } else {
        resultsData = [];
      }
      
      const electionTitle = elections.find(e => e._id === electionId)?.title || 'Unknown Election';
      
      alert(`Results for ${electionTitle}:\n\n${
        resultsData.map(candidate => 
          `${candidate.name || candidate.candidate?.name}: ${candidate.votes || candidate.voteCount || 0} votes`
        ).join('\n')
      }`);
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Failed to load election results');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Calculate statistics
  const totalElections = elections.length;
  const votedElections = elections.filter(e => e.hasVoted).length;
  const activeElections = elections.filter(e => 
    e.status === 'active' || e.votingStatus === 'active'
  ).length;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className="btn btn-primary retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-brand">
          <h2>🎓 CampusVote</h2>
        </div>
        
        <div className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-home"></i>
            Overview
          </button>
          
          <button 
            className="nav-link"
            onClick={() => handleNavigation('/results')}
          >
            <i className="fas fa-chart-bar"></i>
            Results
          </button>
          
          {user?.role === 'admin' && (
            <button 
              className="nav-link"
              onClick={() => handleNavigation('/admin')}
            >
              <i className="fas fa-cog"></i>
              Admin Panel
            </button>
          )}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">Welcome, {user?.firstName || user?.username || 'User'}</span>
            <span className="user-role">{user?.role || 'Voter'}</span>
          </div>
          <button 
            className="btn-logout"
            onClick={onLogout}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Voting Dashboard</h1>
          <p>Welcome back, {user?.firstName || user?.username || 'User'}! Participate in active elections and track your voting history.</p>
        </div>

        {/* Voting Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <h3>{totalElections}</h3>
              <p>Total Elections</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon active">
              <i className="fas fa-play-circle"></i>
            </div>
            <div className="stat-info">
              <h3>{activeElections}</h3>
              <p>Active Elections</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon voted">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <h3>{votedElections}</h3>
              <p>Elections Voted</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon remaining">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3>{activeElections - votedElections}</h3>
              <p>Remaining to Vote</p>
            </div>
          </div>
        </div>

        {/* Active Elections Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Active Elections</h2>
            <button 
              className="btn btn-refresh"
              onClick={loadDashboardData}
              title="Refresh elections"
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
          </div>
          
          {elections.length === 0 ? (
            <div className="no-elections">
              <i className="fas fa-calendar-times"></i>
              <h3>No Active Elections</h3>
              <p>There are currently no active elections. Check back later or contact your administrator.</p>
              {user?.role === 'admin' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleNavigation('/admin')}
                >
                  <i className="fas fa-plus"></i>
                  Create Election
                </button>
              )}
            </div>
          ) : (
            <div className="elections-container">
              {elections.map(election => (
                <ElectionCard
                  key={election._id || election.id}
                  election={election}
                  user={user}
                  onCastVote={handleCastVote}
                  onViewResults={handleViewResults}
                  onNavigate={handleNavigation}
                />
              ))}
            </div>
          )}
        </section>

        {/* Voting History Section */}
        <section className="dashboard-section">
          <h2>Your Voting History</h2>
          {userVotes.length === 0 ? (
            <div className="no-votes">
              <i className="fas fa-history"></i>
              <h3>No Voting History</h3>
              <p>You haven't voted in any elections yet. Participate in active elections to see your voting history here.</p>
            </div>
          ) : (
            <div className="votes-history">
              {userVotes.map(vote => (
                <div key={vote._id} className="vote-item">
                  <div className="vote-info">
                    <h4>{vote.electionId?.title || 'Unknown Election'}</h4>
                    <p>Voted for: <strong>{vote.candidateId?.name || 'Unknown Candidate'}</strong></p>
                    <span className="vote-time">
                      {new Date(vote.timestamp || vote.votedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="vote-status confirmed">
                    <i className="fas fa-check"></i>
                    Confirmed
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions for Admin */}
        {user?.role === 'admin' && (
          <section className="dashboard-section">
            <h2>Admin Quick Actions</h2>
            <div className="quick-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleNavigation('/admin')}
              >
                <i className="fas fa-cog"></i>
                Manage Elections
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleNavigation('/admin?view=users')}
              >
                <i className="fas fa-users"></i>
                Manage Users
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleNavigation('/results')}
              >
                <i className="fas fa-chart-bar"></i>
                View All Results
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Election Card Component
const ElectionCard = ({ election, user, onCastVote, onViewResults, onNavigate }) => {
  const canVote = !election.hasVoted && 
                  (election.status === 'active' || election.votingStatus === 'active') &&
                  election.candidates && 
                  election.candidates.length > 0;
  
  // Determine election status
  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);
  
  let votingStatus = election.votingStatus || 'upcoming';
  if (!election.votingStatus) {
    if (now < startDate) votingStatus = 'upcoming';
    else if (now > endDate) votingStatus = 'ended';
    else votingStatus = 'active';
  }

  return (
    <div className="election-card">
      <div className="election-header">
        <div className="election-title">
          <h3>{election.title}</h3>
          <span className={`election-status ${votingStatus}`}>
            {votingStatus === 'active' ? '🟢 Live' : 
             votingStatus === 'upcoming' ? '🟡 Upcoming' : '🔴 Ended'}
          </span>
        </div>
        <div className="election-meta">
          <span className="total-votes">
            <i className="fas fa-users"></i>
            {election.totalVotes || election.voteCount || 0} votes
          </span>
          <span className="end-date">
            <i className="fas fa-clock"></i>
            {votingStatus === 'active' ? `Ends: ${new Date(election.endDate).toLocaleDateString()}` : `Ended: ${new Date(election.endDate).toLocaleDateString()}`}
          </span>
        </div>
      </div>
      
      <p className="election-description">{election.description}</p>
      
      <div className={`voting-status ${election.hasVoted ? 'voted' : canVote ? 'can-vote' : 'cannot-vote'}`}>
        {election.hasVoted ? 
          <><i className="fas fa-check-circle"></i> You have voted in this election</> : 
          canVote ? 
          <><i className="fas fa-vote-yea"></i> You can vote in this election</> :
          <><i className="fas fa-ban"></i> Voting is not available</>}
      </div>

      {/* Candidates Section */}
      {canVote && election.candidates && election.candidates.length > 0 && (
        <div className="candidates-section">
          <h4>Candidates</h4>
          <div className="candidates-grid">
            {election.candidates.map(candidate => (
              <div key={candidate._id || candidate.id} className="candidate-card">
                <div className="candidate-info">
                  <div className="candidate-avatar">
                    {candidate.photo ? (
                      <img src={candidate.photo} alt={candidate.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {candidate.name ? candidate.name.charAt(0) : '?'}
                      </div>
                    )}
                  </div>
                  <div className="candidate-details">
                    <h5 className="candidate-name">{candidate.name || candidate.student?.name}</h5>
                    <p className="candidate-description">
                      {candidate.description || candidate.slogan || candidate.position || 'Candidate'}
                    </p>
                    <div className="candidate-stats">
                      <span className="votes-count">
                        <i className="fas fa-chart-line"></i>
                        {candidate.votes || candidate.voteCount || 0} votes
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-primary vote-btn"
                  onClick={() => onCastVote(election._id || election.id, candidate._id || candidate.id, candidate.name || candidate.student?.name)}
                >
                  <i className="fas fa-check"></i>
                  Vote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Election Actions */}
      <div className="election-actions">
        <button 
          className="btn btn-outline view-results"
          onClick={() => onViewResults(election._id || election.id)}
        >
          <i className="fas fa-chart-bar"></i>
          View Results
        </button>
        
        {user?.role === 'admin' && (
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate(`/admin?election=${election._id || election.id}`)}
          >
            <i className="fas fa-edit"></i>
            Manage
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;