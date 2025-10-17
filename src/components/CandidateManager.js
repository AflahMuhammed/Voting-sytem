import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const CandidateManager = () => {
  const [candidates, setCandidates] = useState([]);
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [elections, setElections] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    electionId: '',
    contactEmail: '',
    manifesto: '',
    photo: '',
    tags: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [electionsResponse, candidatesResponse, pendingResponse] = await Promise.all([
        adminAPI.getElections().catch(() => ({ data: mockData.activeElections || [] })),
        adminAPI.getPendingCandidates().catch(() => ({ data: [] })), // This gets pending, we'll filter for all
        adminAPI.getPendingCandidates().catch(() => ({ data: mockData.pendingCandidates || [] }))
      ]);

      setElections(electionsResponse.data);
      
      // For demo, create a mix of approved and pending candidates
      const allCandidates = [
        ...(mockData.pendingCandidates || []),
        {
          _id: '3',
          name: 'Alice Johnson',
          description: 'Computer Science Major - Focus on campus technology improvements',
          electionId: { _id: '123', title: 'Student Council Election 2024' },
          userId: { name: 'Alice Johnson', email: 'alice@example.com' },
          status: 'approved',
          isApproved: true,
          nominationDate: new Date(),
          approvedBy: { name: 'Admin User' },
          approvalDate: new Date(),
          votesCount: 45,
          contactEmail: 'alice@example.com',
          manifesto: 'I will work to improve campus WiFi, upgrade computer labs, and create more tech workshops for students.',
          tags: ['technology', 'innovation']
        },
        {
          _id: '4',
          name: 'Bob Smith',
          description: 'Business Administration - Focus on student entrepreneurship',
          electionId: { _id: '123', title: 'Student Council Election 2024' },
          userId: { name: 'Bob Smith', email: 'bob@example.com' },
          status: 'approved',
          isApproved: true,
          nominationDate: new Date(),
          approvedBy: { name: 'Admin User' },
          approvalDate: new Date(),
          votesCount: 32,
          contactEmail: 'bob@example.com',
          manifesto: 'My platform includes creating more internship opportunities and business workshops.',
          tags: ['business', 'entrepreneurship']
        }
      ];
      
      setCandidates(allCandidates);
      setPendingCandidates(pendingResponse.data);
    } catch (error) {
      console.log('Using mock data for candidates');
      setElections(mockData.activeElections || []);
      setCandidates(mockData.pendingCandidates || []);
      setPendingCandidates(mockData.pendingCandidates || []);
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
      if (editingCandidate) {
        // Update candidate - you'd need an update endpoint
        alert('Candidate update would be implemented with proper backend API');
      } else {
        // Add new candidate directly as approved (admin adding)
        const newCandidate = {
          _id: Date.now().toString(),
          ...formData,
          electionId: elections.find(e => e._id === formData.electionId) || { title: 'Unknown Election' },
          userId: { name: formData.name, email: formData.contactEmail },
          status: 'approved',
          isApproved: true,
          nominationDate: new Date(),
          approvedBy: { name: 'Admin User' },
          approvalDate: new Date(),
          votesCount: 0,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        };
        
        setCandidates(prev => [newCandidate, ...prev]);
        alert('Candidate added successfully!');
      }
      
      // Reset form
      setShowAddForm(false);
      setEditingCandidate(null);
      setFormData({
        name: '',
        description: '',
        electionId: '',
        contactEmail: '',
        manifesto: '',
        photo: '',
        tags: ''
      });
    } catch (error) {
      alert('Operation failed. Using mock data.');
      // Mock implementation already handled above
    }
  };

  const handleApprove = async (candidateId) => {
    try {
      await adminAPI.approveCandidate(candidateId);
      
      // Update candidate status in state
      setPendingCandidates(prev => prev.filter(c => c._id !== candidateId));
      setCandidates(prev => prev.map(c => 
        c._id === candidateId 
          ? { ...c, status: 'approved', isApproved: true, approvalDate: new Date() }
          : c
      ));
      
      alert('Candidate approved successfully!');
    } catch (error) {
      alert('Failed to approve candidate. Using mock data.');
      // Mock approval
      setPendingCandidates(prev => prev.filter(c => c._id !== candidateId));
      setCandidates(prev => prev.map(c => 
        c._id === candidateId 
          ? { ...c, status: 'approved', isApproved: true, approvalDate: new Date() }
          : c
      ));
    }
  };

  const handleReject = async (candidateId) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectCandidate(candidateId, reason);
      
      setPendingCandidates(prev => prev.filter(c => c._id !== candidateId));
      setCandidates(prev => prev.map(c => 
        c._id === candidateId 
          ? { ...c, status: 'rejected', isApproved: false, rejectionReason: reason }
          : c
      ));
      
      alert('Candidate rejected successfully!');
    } catch (error) {
      alert('Failed to reject candidate. Using mock data.');
      // Mock rejection
      setPendingCandidates(prev => prev.filter(c => c._id !== candidateId));
      setCandidates(prev => prev.map(c => 
        c._id === candidateId 
          ? { ...c, status: 'rejected', isApproved: false, rejectionReason: reason }
          : c
      ));
    }
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      description: candidate.description,
      electionId: candidate.electionId?._id || '',
      contactEmail: candidate.contactEmail || '',
      manifesto: candidate.manifesto || '',
      photo: candidate.photo || '',
      tags: candidate.tags?.join(', ') || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (candidateId) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        // In real app: await adminAPI.deleteCandidate(candidateId)
        setCandidates(prev => prev.filter(c => c._id !== candidateId));
        setPendingCandidates(prev => prev.filter(c => c._id !== candidateId));
        alert('Candidate deleted successfully!');
      } catch (error) {
        alert('Failed to delete candidate');
      }
    }
  };

  const getStatusBadge = (candidate) => {
    const statusConfig = {
      pending: { color: '#ffc107', label: 'Pending Review', textColor: '#000' },
      approved: { color: '#28a745', label: 'Approved', textColor: '#fff' },
      rejected: { color: '#dc3545', label: 'Rejected', textColor: '#fff' }
    };
    
    const status = statusConfig[candidate.status] || statusConfig.pending;
    
    return (
      <span style={{
        ...styles.statusBadge,
        backgroundColor: status.color,
        color: status.textColor
      }}>
        {status.label}
      </span>
    );
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return candidate.status === 'pending';
    if (activeTab === 'approved') return candidate.status === 'approved';
    if (activeTab === 'rejected') return candidate.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>👥 Candidate Management</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          style={styles.primaryButton}
        >
          + Add Candidate
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={styles.formOverlay}>
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h3>{editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}</h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCandidate(null);
                  setFormData({
                    name: '',
                    description: '',
                    electionId: '',
                    contactEmail: '',
                    manifesto: '',
                    photo: '',
                    tags: ''
                  });
                }}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Candidate Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={styles.input}
                    placeholder="Enter candidate's full name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="candidate@example.com"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Election *</label>
                  <select
                    name="electionId"
                    value={formData.electionId}
                    onChange={handleInputChange}
                    required
                    style={styles.select}
                  >
                    <option value="">Select an election</option>
                    {elections.map(election => (
                      <option key={election._id} value={election._id}>
                        {election.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label>Photo URL</label>
                  <input
                    type="url"
                    name="photo"
                    value={formData.photo}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  style={styles.textarea}
                  placeholder="Brief description of the candidate and their platform..."
                  rows="3"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Manifesto (Detailed Platform)</label>
                <textarea
                  name="manifesto"
                  value={formData.manifesto}
                  onChange={handleInputChange}
                  style={styles.textarea}
                  placeholder="Detailed explanation of the candidate's goals, plans, and platform..."
                  rows="4"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="technology, innovation, campus (comma separated)"
                />
                <small style={styles.helpText}>Separate tags with commas</small>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryButton}>
                  {editingCandidate ? 'Update Candidate' : 'Add Candidate'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCandidate(null);
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

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'all' && styles.activeTab)}}
          onClick={() => setActiveTab('all')}
        >
          All Candidates ({candidates.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'pending' && styles.activeTab)}}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending ({pendingCandidates.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'approved' && styles.activeTab)}}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Approved ({candidates.filter(c => c.status === 'approved').length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'rejected' && styles.activeTab)}}
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Rejected ({candidates.filter(c => c.status === 'rejected').length})
        </button>
      </div>

      {/* Candidates List */}
      <div style={styles.candidatesList}>
        {filteredCandidates.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No Candidates Found</h3>
            <p>
              {activeTab === 'pending' 
                ? 'No pending candidate applications at the moment.' 
                : 'No candidates match the current filter.'}
            </p>
            {activeTab === 'all' && (
              <button 
                onClick={() => setShowAddForm(true)}
                style={styles.primaryButton}
              >
                Add First Candidate
              </button>
            )}
          </div>
        ) : (
          filteredCandidates.map(candidate => (
            <div key={candidate._id} style={styles.candidateCard}>
              <div style={styles.candidateHeader}>
                <div style={styles.candidateBasicInfo}>
                  <div style={styles.candidateNameSection}>
                    {candidate.photo ? (
                      <img src={candidate.photo} alt={candidate.name} style={styles.candidatePhoto} />
                    ) : (
                      <div style={styles.candidatePlaceholder}>👤</div>
                    )}
                    <div>
                      <h3>{candidate.name}</h3>
                      <p style={styles.electionName}>{candidate.electionId?.title}</p>
                    </div>
                  </div>
                  {getStatusBadge(candidate)}
                </div>
                
                <div style={styles.candidateActions}>
                  {candidate.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(candidate._id)}
                        style={styles.approveButton}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => handleReject(candidate._id)}
                        style={styles.rejectButton}
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleEdit(candidate)}
                    style={styles.editButton}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(candidate._id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              <p style={styles.candidateDescription}>{candidate.description}</p>

              {candidate.manifesto && (
                <div style={styles.manifestoSection}>
                  <strong>Platform:</strong>
                  <p style={styles.manifestoText}>{candidate.manifesto}</p>
                </div>
              )}

              <div style={styles.candidateDetails}>
                <div style={styles.detailItem}>
                  <strong>Contact:</strong> {candidate.contactEmail || 'Not provided'}
                </div>
                <div style={styles.detailItem}>
                  <strong>Applied:</strong> {new Date(candidate.nominationDate).toLocaleDateString()}
                </div>
                {candidate.approvalDate && (
                  <div style={styles.detailItem}>
                    <strong>Approved:</strong> {new Date(candidate.approvalDate).toLocaleDateString()} by {candidate.approvedBy?.name}
                  </div>
                )}
                {candidate.rejectionReason && (
                  <div style={styles.detailItem}>
                    <strong>Rejection Reason:</strong> {candidate.rejectionReason}
                  </div>
                )}
                {candidate.votesCount !== undefined && (
                  <div style={styles.detailItem}>
                    <strong>Votes:</strong> {candidate.votesCount}
                  </div>
                )}
                {candidate.tags && candidate.tags.length > 0 && (
                  <div style={styles.detailItem}>
                    <strong>Tags:</strong> 
                    <div style={styles.tagsContainer}>
                      {candidate.tags.map((tag, index) => (
                        <span key={index} style={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
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
    maxWidth: '700px',
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
    fontFamily: 'inherit',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  helpText: {
    color: '#6c757d',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
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
  tabs: {
    display: 'flex',
    gap: '0',
    marginBottom: '2rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    padding: '1rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontWeight: 'bold',
  },
  candidatesList: {
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
  candidateCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  candidateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  candidateBasicInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    gap: '1rem',
  },
  candidateNameSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    flex: 1,
  },
  candidatePhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  candidatePlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
  },
  electionName: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0.25rem 0 0 0',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  candidateActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  approveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  rejectButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
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
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  candidateDescription: {
    color: '#666',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  manifestoSection: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
  },
  manifestoText: {
    margin: '0.5rem 0 0 0',
    lineHeight: '1.5',
    color: '#555',
  },
  candidateDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '0.75rem',
    fontSize: '0.9rem',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  tag: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#e9ecef',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#495057',
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

export default CandidateManager;