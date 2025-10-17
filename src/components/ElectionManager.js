// src/components/ElectionManager.js
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const ElectionManager = () => {
  const [elections, setElections] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingElection, setEditingElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllElections();
      if (response.data.success) {
        setElections(response.data.elections);
      } else {
        setError('Failed to load elections');
      }
    } catch (error) {
      console.error('Error loading elections:', error);
      setError('Failed to load elections from server. Make sure backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const electionData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      const response = await adminAPI.createElection(electionData);
      
      if (response.data.success) {
        setElections([response.data.election, ...elections]);
        alert('Election created successfully!');
        
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: ''
        });
      } else {
        alert('Failed to create election');
      }
      
    } catch (error) {
      console.error('Error creating election:', error);
      alert('Failed to create election. Please check if the backend is running.');
    }
  };

  const handleEdit = (election) => {
    setEditingElection(election);
    setFormData({
      title: election.title,
      description: election.description,
      startDate: election.startDate ? new Date(election.startDate).toISOString().split('T')[0] : '',
      endDate: election.endDate ? new Date(election.endDate).toISOString().split('T')[0] : ''
    });
    setShowCreateForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const electionData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      const response = await adminAPI.updateElection(editingElection.id, electionData);
      
      if (response.data.success) {
        setElections(elections.map(election => 
          election.id === editingElection.id ? response.data.election : election
        ));
        alert('Election updated successfully!');
        
        setShowCreateForm(false);
        setEditingElection(null);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: ''
        });
      } else {
        alert('Failed to update election');
      }
      
    } catch (error) {
      console.error('Error updating election:', error);
      alert('Failed to update election');
    }
  };

  const handleDelete = async (electionId) => {
    if (window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      try {
        const response = await adminAPI.deleteElection(electionId);
        if (response.data.success) {
          setElections(elections.filter(e => e.id !== electionId));
          alert('Election deleted successfully!');
        } else {
          alert('Failed to delete election');
        }
      } catch (error) {
        console.error('Error deleting election:', error);
        alert('Failed to delete election');
      }
    }
  };

  const getStatusBadge = (election) => {
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    let votingStatus = 'upcoming';
    if (now >= startDate && now <= endDate) {
      votingStatus = 'active';
    } else if (now > endDate) {
      votingStatus = 'completed';
    }

    const statusConfig = {
      active: { color: '#28a745', label: 'Active' },
      inactive: { color: '#6c757d', label: 'Inactive' }
    };
    
    const votingStatusConfig = {
      upcoming: { color: '#ffc107', label: 'Upcoming' },
      active: { color: '#17a2b8', label: 'Active' },
      completed: { color: '#6c757d', label: 'Completed' }
    };
    
    const status = statusConfig[election.status] || statusConfig.active;
    const votingStatusInfo = votingStatusConfig[votingStatus] || votingStatusConfig.upcoming;
    
    return (
      <div style={styles.statusContainer}>
        <span style={{...styles.statusBadge, backgroundColor: status.color}}>
          {status.label}
        </span>
        <span style={{...styles.statusBadge, backgroundColor: votingStatusInfo.color}}>
          {votingStatusInfo.label}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading elections...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🗳️ Election Management</h2>
        <div style={styles.headerActions}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
              <button onClick={loadElections} style={styles.retryButton}>Retry</button>
            </div>
          )}
          <button 
            onClick={() => setShowCreateForm(true)}
            style={styles.primaryButton}
          >
            + Create New Election
          </button>
        </div>
      </div>

      {/* Create/Edit Election Form */}
      {showCreateForm && (
        <div style={styles.formOverlay}>
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h3>{editingElection ? 'Edit Election' : 'Create New Election'}</h3>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingElection(null);
                  setFormData({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: ''
                  });
                }}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingElection ? handleUpdate : handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Election Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                    placeholder="e.g., Student Council Election 2024"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="Describe the purpose and scope of this election..."
                  rows="3"
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryButton}>
                  {editingElection ? 'Update Election' : 'Create Election'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingElection(null);
                    setFormData({
                      title: '',
                      description: '',
                      startDate: '',
                      endDate: ''
                    });
                  }}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elections List */}
      <div style={styles.electionsList}>
        {elections.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No Elections Created Yet</h3>
            <p>Create your first election to get started!</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              style={styles.primaryButton}
            >
              Create First Election
            </button>
          </div>
        ) : (
          elections.map(election => (
            <div key={election.id} style={styles.electionCard}>
              <div style={styles.electionHeader}>
                <div style={styles.electionInfo}>
                  <h3>{election.title}</h3>
                  {getStatusBadge(election)}
                </div>
                <div style={styles.electionActions}>
                  <button 
                    onClick={() => handleEdit(election)}
                    style={styles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(election.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <p style={styles.electionDescription}>{election.description}</p>

              <div style={styles.electionDetails}>
                <div style={styles.detailItem}>
                  <strong>Period:</strong> {new Date(election.startDate).toLocaleDateString()} to {new Date(election.endDate).toLocaleDateString()}
                </div>
                <div style={styles.detailItem}>
                  <strong>Status:</strong> {election.status}
                </div>
                {election.createdBy && (
                  <div style={styles.detailItem}>
                    <strong>Created By:</strong> {election.createdBy}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  retryButton: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  formOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '1rem',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6c757d',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    borderTop: '1px solid #e9ecef',
    paddingTop: '1.5rem',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  electionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666',
  },
  electionCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  electionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  electionInfo: {
    flex: 1,
  },
  statusContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'white',
  },
  electionActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  electionDescription: {
    color: '#666',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  electionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  detailItem: {
    fontSize: '0.9rem',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    fontSize: '1.2rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4CAF50',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
};

export default ElectionManager;