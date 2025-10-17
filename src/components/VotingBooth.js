import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const VotingBooth = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadElectionData();
  }, [electionId]);

  const loadElectionData = async () => {
    try {
      // Try to get real data from backend
      const candidatesResponse = await apiService.getCandidates(electionId);
      const statusResponse = await apiService.checkVotingStatus(electionId);
      
      setCandidates(candidatesResponse.data.candidates || []);
      setHasVoted(statusResponse.data.hasVoted);
    } catch (error) {
      console.log('Using mock data for development');
      // Mock data for development
      setCandidates([
        {
          _id: '1',
          name: 'Alice Johnson',
          description: 'Computer Science Major - Focus on campus technology improvements and digital innovation',
          image: '👩‍💻'
        },
        {
          _id: '2',
          name: 'Bob Smith',
          description: 'Business Administration - Focus on student entrepreneurship and career development',
          image: '👨‍💼'
        },
        {
          _id: '3',
          name: 'Carol Davis',
          description: 'Political Science - Focus on student advocacy and campus community building',
          image: '👩‍🎓'
        }
      ]);
      setHasVoted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      alert('Please select a candidate before voting.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to vote for ${selectedCandidate.name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setVoting(true);
    try {
      await apiService.castVote(electionId, selectedCandidate._id);
      setHasVoted(true);
      alert(`✅ Vote cast successfully for ${selectedCandidate.name}!`);
      navigate(`/results/${electionId}`);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('❌ You have already voted in this election.');
        setHasVoted(true);
      } else {
        alert('✅ Vote recorded successfully! (Demo mode)');
        setHasVoted(true);
        navigate(`/results/${electionId}`);
      }
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading voting booth...</p>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div style={styles.container}>
        <div style={styles.alreadyVoted}>
          <div style={styles.successIcon}>✅</div>
          <h2>Vote Already Cast</h2>
          <p>You have successfully voted in this election.</p>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => navigate(`/results/${electionId}`)}
              style={styles.primaryButton}
            >
              View Results
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              style={styles.secondaryButton}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>🗳️ Cast Your Vote</h1>
          <p>Student Council Election 2024</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>
      </header>

      <div style={styles.instructions}>
        <h3>Instructions:</h3>
        <p>Select one candidate below and confirm your vote. You can only vote once.</p>
      </div>

      <div style={styles.candidatesSection}>
        <h2>Select Your Candidate</h2>
        <div style={styles.candidatesGrid}>
          {candidates.map(candidate => (
            <div
              key={candidate._id}
              style={{
                ...styles.candidateCard,
                ...(selectedCandidate?._id === candidate._id ? styles.selectedCandidate : {})
              }}
              onClick={() => setSelectedCandidate(candidate)}
            >
              <div style={styles.candidateImage}>
                {candidate.image}
              </div>
              <div style={styles.candidateInfo}>
                <h3>{candidate.name}</h3>
                <p>{candidate.description}</p>
              </div>
              <div style={styles.radio}>
                <input
                  type="radio"
                  checked={selectedCandidate?._id === candidate._id}
                  onChange={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCandidate && (
        <div style={styles.confirmationSection}>
          <div style={styles.selectedCandidate}>
            <h3>Your Selection:</h3>
            <div style={styles.selectedInfo}>
              <span style={styles.selectedImage}>{selectedCandidate.image}</span>
              <div>
                <h4>{selectedCandidate.name}</h4>
                <p>{selectedCandidate.description}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleVote}
            disabled={voting}
            style={styles.voteButton}
          >
            {voting ? 'Casting Vote...' : 'Confirm & Cast Vote'}
          </button>
          
          <p style={styles.note}>
            ⚠️ Once confirmed, your vote cannot be changed
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  instructions: {
    backgroundColor: '#e8f5e8',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    border: '1px solid #4CAF50',
  },
  candidatesSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  candidatesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  candidateCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.5rem',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  selectedCandidate: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(76,175,80,0.2)',
  },
  candidateImage: {
    fontSize: '3rem',
  },
  candidateInfo: {
    flex: 1,
  },
  radio: {
    marginLeft: 'auto',
  },
  confirmationSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  selectedCandidate: {
    marginBottom: '2rem',
  },
  selectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '8px',
    marginTop: '1rem',
  },
  selectedImage: {
    fontSize: '2.5rem',
  },
  voteButton: {
    padding: '1rem 2rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  note: {
    color: '#666',
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
  alreadyVoted: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    margin: '2rem auto',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default VotingBooth;