// components/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './AdminPanel.css';

const AdminPanel = ({ onLogout }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('overview');
  
  const [elections, setElections] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [alerts, setAlerts] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  // Load initial data
  useEffect(() => {
    loadElections();
    loadUsers();
  }, []);

  // Load elections from API
  const loadElections = async () => {
    try {
      const response = await adminAPI.getAllElections();
      setElections(response.data.elections || []);
    } catch (error) {
      console.error('Failed to load elections:', error);
      showAlert("Failed to load elections", "error");
    }
  };

  // Load users from API
  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      showAlert("Failed to load users", "error");
    }
  };

  // Navigation handler
  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  // Handle input changes for election form
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  // User Management Functions
  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
        showAlert("User deleted successfully", "success");
      } catch (error) {
        console.error('Failed to delete user:', error);
        showAlert("Failed to delete user", "error");
      }
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      await adminAPI.updateUserStatus(userId, newStatus);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      showAlert("User status updated successfully", "success");
    } catch (error) {
      console.error('Failed to update user status:', error);
      showAlert("Failed to update user status", "error");
    }
  };

  const resetUserPassword = async (userId) => {
    const newPassword = prompt('Enter new password for this user (min. 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      try {
        await adminAPI.resetUserPassword(userId, newPassword);
        showAlert('Password reset successfully!', "success");
      } catch (error) {
        console.error('Failed to reset password:', error);
        showAlert('Failed to reset password', "error");
      }
    } else if (newPassword) {
      showAlert('Password must be at least 6 characters long.', "error");
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.collegeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Election Functions
 // In your AdminPanel component, the endElection function should look like this:
const endElection = async (electionId) => {
    try {
      const response = await adminAPI.endElection(electionId);
      if (response.data.success) {
        setElections(elections.map(election => 
          election._id === electionId 
            ? { ...election, status: "ended" }
            : election
        ));
        setShowEndModal(false);
        showAlert("Election ended successfully", "success");
      }
    } catch (error) {
      console.error('Failed to end election:', error);
      showAlert("Failed to end election", "error");
    }
  };

  const deleteElection = async (electionId) => {
    try {
      await adminAPI.deleteElection(electionId);
      setElections(elections.filter(e => e._id !== electionId));
      setShowDeleteModal(false);
      showAlert("Election deleted successfully", "success");
    } catch (error) {
      console.error('Failed to delete election:', error);
      showAlert("Failed to delete election", "error");
    }
  };

  // Election creation function
  const createElection = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.startDate || !formData.endDate) {
      showAlert("Please fill in all required fields", "error");
      return;
    }
  
    try {
      const response = await adminAPI.createElection({
        title: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      setElections(prev => [...prev, response.data.election]);
      setFormData({ name: '', description: '', startDate: '', endDate: '' });
      showAlert("Election created successfully!", "success");
      
    } catch (error) {
      showAlert(error.response?.data?.message || "Failed to create election", "error");
    }
  };

  const showAlert = (message, type) => {
    setAlerts({ message, type, show: true });
    setTimeout(() => setAlerts({ show: false }), 5000);
  };

  const stats = {
    active: elections.filter(e => e.status === "active").length,
    ended: elections.filter(e => e.status === "ended").length,
    completed: elections.filter(e => e.status === "completed").length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length
  };

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <>
            <ElectionManagement 
              elections={elections}
              onEndElection={(election) => {
                setSelectedElection(election);
                setShowEndModal(true);
              }}
              onDeleteElection={(election) => {
                setSelectedElection(election);
                setShowDeleteModal(true);
              }}
            />
            
            <CreateElectionForm 
              formData={formData}
              onChange={handleInputChange}
              onSubmit={createElection}
            />
          </>
        );
      
      case 'candidates':
        return <CandidateManagement elections={elections} />;
      
      case 'reports':
        return <ReportsView elections={elections} />;
      
      case 'email':
        return <EmailView users={users} />;
      
      case 'users':
        return <UserManagement 
          users={filteredUsers}
          totalUsers={users.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onDeleteUser={deleteUser}
          onToggleUserStatus={toggleUserStatus}
          onResetPassword={resetUserPassword}
        />;
      
      default:
        return (
          <>
            <ElectionManagement 
              elections={elections}
              onEndElection={(election) => {
                setSelectedElection(election);
                setShowEndModal(true);
              }}
              onDeleteElection={(election) => {
                setSelectedElection(election);
                setShowDeleteModal(true);
              }}
            />
            
            <CreateElectionForm 
              formData={formData}
              onChange={handleInputChange}
              onSubmit={createElection}
            />
          </>
        );
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-info">
          <h1>Admin Panel</h1>
          <p>Welcome, Admin User - Full System Control</p>
          <div className="navigation-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
            <button 
              className="btn btn-logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <nav className="admin-nav">
        <ul>
          <li>
            <a 
              href="#overview" 
              className={currentView === 'overview' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigation('overview'); }}
            >
              📊 Overview
            </a>
          </li>
          <li>
            <a 
              href="#users" 
              className={currentView === 'users' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigation('users'); }}
            >
              👥 Users
            </a>
          </li>
          <li>
            <a 
              href="#candidates" 
              className={currentView === 'candidates' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigation('candidates'); }}
            >
              🗳️ Candidates
            </a>
          </li>
          <li>
            <a 
              href="#reports" 
              className={currentView === 'reports' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigation('reports'); }}
            >
              📈 Reports
            </a>
          </li>
          <li>
            <a 
              href="#email" 
              className={currentView === 'email' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleNavigation('email'); }}
            >
              ✉️ Email
            </a>
          </li>
        </ul>
      </nav>

      {alerts.show && (
        <div className={`alert alert-${alerts.type === 'error' ? 'danger' : 'success'}`}>
          {alerts.message}
        </div>
      )}

      <div className="admin-dashboard">
        <div className="main-content">
          {renderCurrentView()}
        </div>
        
        <div className="sidebar">
          <ElectionStats stats={stats} />
          <QuickActions onNavigate={handleNavigation} />
        </div>
      </div>

      {showDeleteModal && selectedElection && (
        <DeleteModal 
          election={selectedElection}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => deleteElection(selectedElection._id)}
        />
      )}

      {showEndModal && selectedElection && (
        <EndElectionModal 
          election={selectedElection}
          onCancel={() => setShowEndModal(false)}
          onConfirm={() => endElection(selectedElection._id)}
        />
      )}
    </div>
  );
};

// User Management Component
const UserManagement = ({ 
  users, 
  totalUsers, 
  searchTerm, 
  onSearchChange, 
  onDeleteUser, 
  onToggleUserStatus, 
  onResetPassword 
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>👥 User Management</h2>
        <p>Manage all registered students and their accounts</p>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.status === 'suspended').length}</div>
          <div className="stat-label">Suspended Users</div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users by name, email, or college ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <span className="search-results">
          {users.length} users found
        </span>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>College ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Votes Cast</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-users">
                  {searchTerm ? 'No users found matching your search.' : 'No users found. Students will appear here when they register.'}
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className={user.status === 'suspended' ? 'inactive-user' : ''}>
                  <td className="college-id">
                    <strong>{user.collegeId}</strong>
                  </td>
                  <td className="user-name">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td className="user-status">
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="join-date">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="votes-count">
                    {user.votesCount || 0}
                  </td>
                  <td className="user-actions">
                    <button
                      className="btn-action btn-suspend"
                      onClick={() => onToggleUserStatus(user._id)}
                      title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                    >
                      {user.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className="btn-action btn-reset"
                      onClick={() => onResetPassword(user._id)}
                      title="Reset Password"
                    >
                      🔑
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => onDeleteUser(user._id)}
                      title="Delete User"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-notes">
        <h4>📝 Admin Notes</h4>
        <ul>
          <li>Use suspend/activate to temporarily disable user accounts</li>
          <li>Reset passwords when users forget their credentials</li>
          <li>Delete users only when necessary - this action is permanent</li>
          <li>College IDs are unique and cannot be changed</li>
        </ul>
      </div>
    </div>
  );
};

// Candidate Management Component
const CandidateManagement = ({ elections }) => {
  const [candidates, setCandidates] = useState([]);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    position: '',
    election: elections.length > 0 ? elections[0]._id : '',
    bio: ''
  });

  // Load candidates when component mounts or elections change
  useEffect(() => {
    loadCandidates();
  }, [elections]);

  const loadCandidates = async () => {
    try {
      // This would need to be implemented in your API
      // const response = await adminAPI.getCandidates();
      // setCandidates(response.data.candidates);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await adminAPI.addCandidate({
        name: newCandidate.name,
        email: newCandidate.email,
        position: newCandidate.position,
        electionId: newCandidate.election,
        bio: newCandidate.bio
      });

      setCandidates(prev => [...prev, response.data.candidate]);
      setNewCandidate({
        name: '',
        email: '',
        position: '',
        election: elections.length > 0 ? elections[0]._id : '',
        bio: ''
      });
      setShowAddCandidate(false);
      
      alert("Candidate added successfully!");
      
    } catch (error) {
      console.error('Failed to add candidate:', error);
      alert(error.response?.data?.message || "Failed to add candidate");
    }
  };

  const handleInputChange = (e) => {
    setNewCandidate({
      ...newCandidate,
      [e.target.name]: e.target.value
    });
  };

  const deleteCandidate = async (candidateId) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await adminAPI.deleteCandidate(candidateId);
        setCandidates(candidates.filter(c => c._id !== candidateId));
        alert("Candidate deleted successfully!");
      } catch (error) {
        console.error('Failed to delete candidate:', error);
        alert("Failed to delete candidate");
      }
    }
  };

  return (
    <div className="candidate-management">
      <div className="card">
        <div className="card-header">
          <h2>🗳️ Candidate Management</h2>
          <p>Manage all candidates across elections</p>
        </div>

        <div className="candidate-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddCandidate(true)}
            disabled={elections.length === 0}
          >
            Add New Candidate
          </button>
        </div>

        {elections.length === 0 && (
          <div className="no-elections-warning">
            <p>⚠️ You need to create an election first before adding candidates.</p>
          </div>
        )}

        {/* Add Candidate Form */}
        {showAddCandidate && (
          <div className="add-candidate-form">
            <h3>Add New Candidate</h3>
            <form onSubmit={handleAddCandidate}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newCandidate.name}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newCandidate.email}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={newCandidate.position}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                    placeholder="e.g., President, Vice President"
                  />
                </div>
                <div className="form-group">
                  <label>Election *</label>
                  <select
                    name="election"
                    value={newCandidate.election}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select an election</option>
                    {elections.map(election => (
                      <option key={election._id} value={election._id}>
                        {election.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Bio/Slogan</label>
                <textarea
                  name="bio"
                  value={newCandidate.bio}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Candidate biography and qualifications..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Candidate</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddCandidate(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Candidates List */}
        <div className="candidates-list">
          <h3>All Candidates ({candidates.length})</h3>
          {candidates.length === 0 ? (
            <div className="no-candidates">
              <p>No candidates found. {elections.length === 0 ? 'Create an election first, then ' : ''}Add your first candidate to get started.</p>
            </div>
          ) : (
            <div className="candidates-grid">
              {candidates.map(candidate => (
                <div key={candidate._id} className="candidate-card">
                  <div className="candidate-info">
                    <div className="candidate-avatar">
                      <div className="avatar-placeholder">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                    <div className="candidate-details">
                      <h4>{candidate.name}</h4>
                      <p className="candidate-position">{candidate.position}</p>
                      <p className="candidate-email">{candidate.email}</p>
                      <p className="candidate-election">
                        {elections.find(e => e._id === candidate.election)?.title || 'Unknown Election'}
                      </p>
                      <span className={`status-badge ${candidate.status || 'active'}`}>
                        {candidate.status || 'active'}
                      </span>
                    </div>
                  </div>
                  <div className="candidate-actions">
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => deleteCandidate(candidate._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Election Management Component
const ElectionManagement = ({ elections, onEndElection, onDeleteElection }) => (
  <div className="card">
    <h2>📊 Election Management</h2>
    
    {elections.length === 0 ? (
      <div className="no-elections">
        <span>📊</span>
        <h3>No Elections Created</h3>
        <p>Create your first election using the form below to get started.</p>
      </div>
    ) : (
      <div className="elections-grid">
        {elections.map(election => (
          <ElectionCard 
            key={election._id}
            election={election}
            onEndElection={onEndElection}
            onDeleteElection={onDeleteElection}
          />
        ))}
      </div>
    )}
  </div>
);

// Election Card Component
const ElectionCard = ({ election, onEndElection, onDeleteElection }) => (
  <div className="election-card">
    <div className="election-header">
      <h3>{election.title}</h3>
      <span className={`election-status ${election.status}`}>
        {election.status}
      </span>
    </div>
    <p className="election-description">{election.description}</p>
    
    <div className="election-details">
      <div className="detail-item">
        <div className="detail-label">Start Date</div>
        <div className="detail-value">
          {new Date(election.startDate).toLocaleDateString()}
        </div>
      </div>
      <div className="detail-item">
        <div className="detail-label">End Date</div>
        <div className="detail-value">
          {new Date(election.endDate).toLocaleDateString()}
        </div>
      </div>
      <div className="detail-item">
        <div className="detail-label">Election ID</div>
        <div className="detail-value">{election._id}</div>
      </div>
    </div>
    
    <div className="election-actions">
      {election.status === "active" && (
        <button 
          className="btn btn-warning"
          onClick={() => onEndElection(election)}
        >
          End Election
        </button>
      )}
      <button 
        className="btn btn-danger"
        onClick={() => onDeleteElection(election)}
      >
        Delete Election
      </button>
    </div>
  </div>
);

// Create Election Form Component
const CreateElectionForm = ({ formData, onChange, onSubmit }) => (
  <div className="card">
    <h2>Create New Election</h2>
    
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="name">Election Name *</label>
        <input 
          type="text" 
          id="name" 
          className="form-control" 
          placeholder="Enter election name"
          value={formData.name}
          onChange={onChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea 
          id="description" 
          className="form-control" 
          rows="3" 
          placeholder="Enter election description"
          value={formData.description}
          onChange={onChange}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">Start Date *</label>
          <input 
            type="date" 
            id="startDate" 
            className="form-control"
            value={formData.startDate}
            onChange={onChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="endDate">End Date *</label>
          <input 
            type="date" 
            id="endDate" 
            className="form-control"
            value={formData.endDate}
            onChange={onChange}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <button type="submit" className="btn btn-primary">Create Election</button>
      </div>
    </form>
  </div>
);

// Election Stats Component
const ElectionStats = ({ stats }) => (
  <div className="card">
    <h2>📈 Election Statistics</h2>
    
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{stats.active}</div>
        <div className="stat-label">Active Elections</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.ended}</div>
        <div className="stat-label">Ended Elections</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.completed}</div>
        <div className="stat-label">Completed</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.totalUsers}</div>
        <div className="stat-label">Total Users</div>
      </div>

      <div className="stat-card">
        <div className="stat-value">{stats.activeUsers}</div>
        <div className="stat-label">Active Users</div>
      </div>
    </div>
  </div>
);

// Quick Actions Component
const QuickActions = ({ onNavigate }) => (
  <div className="card">
    <h2>⚡ Quick Actions</h2>
    <div className="quick-actions-list">
      <button 
        className="btn btn-primary"
        onClick={() => onNavigate('overview')}
      >
        Create New Election
      </button>
      <button 
        className="btn btn-secondary"
        onClick={() => onNavigate('candidates')}
      >
        Manage Candidates
      </button>
      <button 
        className="btn btn-secondary"
        onClick={() => onNavigate('users')}
      >
        Manage Users
      </button>
      <button 
        className="btn btn-secondary"
        onClick={() => onNavigate('reports')}
      >
        Generate Reports
      </button>
    </div>
  </div>
);

// Delete Modal Component
const DeleteModal = ({ election, onCancel, onConfirm }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">Confirm Deletion</h3>
        <span className="close" onClick={onCancel}>&times;</span>
      </div>
      <div className="modal-body">
        <p>Are you sure you want to delete the election <strong>"{election.title}"</strong>?</p>
        <p>This action cannot be undone and all election data including votes will be permanently lost.</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm}>Delete Election</button>
      </div>
    </div>
  </div>
);

// End Election Modal Component
const EndElectionModal = ({ election, onCancel, onConfirm }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3 className="modal-title">End Election</h3>
        <span className="close" onClick={onCancel}>&times;</span>
      </div>
      <div className="modal-body">
        <p>Are you sure you want to end the election <strong>"{election.title}"</strong>?</p>
        <p>Once ended, no more votes can be cast and results will be finalized.</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-warning" onClick={onConfirm}>End Election</button>
      </div>
    </div>
  </div>
);

// Reports View Component
const ReportsView = ({ elections }) => (
  <div className="card">
    <h2>📈 Election Reports</h2>
    <p>Generate and view detailed election reports and analytics.</p>
    
    {elections.length === 0 ? (
      <div className="no-data-message">
        <p>No election data available. Create elections first to generate reports.</p>
      </div>
    ) : (
      <div className="reports-grid">
        {elections.map(election => (
          <div key={election._id} className="report-card">
            <h4>{election.title}</h4>
            <div className="report-stats">
              <div className="report-stat">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${election.status}`}>{election.status}</span>
              </div>
              <div className="report-stat">
                <span className="stat-label">Total Votes:</span>
                <span className="stat-value">{election.totalVotes || 0}</span>
              </div>
              <div className="report-stat">
                <span className="stat-label">Candidates:</span>
                <span className="stat-value">{election.candidates?.length || 0}</span>
              </div>
            </div>
            <button className="btn btn-primary">Generate Report</button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Email View Component
const EmailView = ({ users }) => (
  <div className="card">
    <h2>✉️ Email Management</h2>
    <p>Send emails to voters and candidates.</p>
    
    <div className="email-actions">
      <button className="btn btn-primary">Email All Voters</button>
      <button className="btn btn-secondary">Email Candidates</button>
      <button className="btn btn-secondary">Custom Email</button>
    </div>

    <div className="email-stats">
      <div className="stat-card">
        <div className="stat-value">{users.length}</div>
        <div className="stat-label">Total Users</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
        <div className="stat-label">Active Users</div>
      </div>
    </div>
  </div>
);

export default AdminPanel;