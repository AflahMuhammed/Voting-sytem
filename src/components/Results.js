import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Results = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [electionId]);

  const loadResults = async () => {
    try {
      const response = await apiService.getResults(electionId);
      setResults(response.data.results || []);
    } catch (error) {
      console.log('Using mock data for results');
      // Mock data for development
      setResults([
        {
          _id: '1',
          name: 'Alice Johnson',
          description: 'Computer Science Major',
          votesCount: 85,
          totalVotes: 85,
          image: '👩‍💻'
        },
        {
          _id: '2',
          name: 'Bob Smith',
          description: 'Business Administration',
          votesCount: 65,
          totalVotes: 65,
          image: '👨‍💼'
        },
        {
          _id: '3',
          name: 'Carol Davis',
          description: 'Political Science',
          votesCount: 45,
          totalVotes: 45,
          image: '👩‍🎓'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = results.reduce((sum, candidate) => sum + candidate.votesCount, 0);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading election results...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>📊 Election Results</h1>
          <p>Student Council Election 2024 - Live Results</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Results Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <h3>Total Votes Cast</h3>
          <p style={styles.totalVotes}>{totalVotes}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Candidates</h3>
          <p style={styles.candidateCount}>{results.length}</p>
        </div>
        <div style={styles.summaryCard}>
          <h3>Turnout</h3>
          <p style={styles.turnout}>39%</p>
        </div>
      </div>

      {/* Results List */}
      <div style={styles.resultsSection}>
        <h2>Candidate Results</h2>
        <div style={styles.resultsList}>
          {results
            .sort((a, b) => b.votesCount - a.votesCount)
            .map((candidate, index) => {
              const percentage = totalVotes > 0 ? (candidate.votesCount / totalVotes) * 100 : 0;
              const isWinner = index === 0;
              
              return (
                <div 
                  key={candidate._id} 
                  style={{
                    ...styles.candidateResult,
                    ...(isWinner ? styles.winnerCard : {})
                  }}
                >
                  {isWinner && <div style={styles.winnerBadge}>🏆 Winner</div>}
                  
                  <div style={styles.candidateHeader}>
                    <div style={styles.candidateImage}>
                      {candidate.image}
                    </div>
                    <div style={styles.candidateInfo}>
                      <h3>
                        #{index + 1} {candidate.name}
                        {isWinner && <span style={styles.winnerText}> - Leading</span>}
                      </h3>
                      <p>{candidate.description}</p>
                    </div>
                    <div style={styles.voteCount}>
                      <strong>{candidate.votesCount}</strong>
                      <span>votes</span>
                      <div style={styles.percentage}>{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div style={styles.progressContainer}>
                    <div 
                      style={{
                        ...styles.progressBar,
                        width: `${percentage}%`,
                        backgroundColor: isWinner ? '#4CAF50' : '#2196F3'
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Statistics */}
      <div style={styles.statistics}>
        <h2>Voting Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <h4>Most Votes</h4>
            <p>{results[0]?.name || 'N/A'}</p>
            <span>{results[0]?.votesCount || 0} votes</span>
          </div>
          <div style={styles.statItem}>
            <h4>Close Race</h4>
            <p>{(results[0]?.votesCount || 0) - (results[1]?.votesCount || 0)} vote difference</p>
          </div>
          <div style={styles.statItem}>
            <h4>Voting Rate</h4>
            <p>~{Math.round(totalVotes / 500 * 100)}% of eligible voters</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={styles.primaryButton}
        >
          Back to Dashboard
        </button>
        <button 
          onClick={() => window.location.reload()}
          style={styles.secondaryButton}
        >
          Refresh Results
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
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
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  totalVotes: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#4CAF50',
    margin: '0.5rem 0 0 0',
  },
  candidateCount: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#2196F3',
    margin: '0.5rem 0 0 0',
  },
  turnout: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#FF9800',
    margin: '0.5rem 0 0 0',
  },
  resultsSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },
  candidateResult: {
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    padding: '1.5rem',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  winnerCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(76,175,80,0.2)',
  },
  winnerBadge: {
    position: 'absolute',
    top: '-10px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  candidateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1rem',
  },
  candidateImage: {
    fontSize: '3rem',
  },
  candidateInfo: {
    flex: 1,
  },
  winnerText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  voteCount: {
    textAlign: 'center',
    minWidth: '80px',
  },
  percentage: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressContainer: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.5s ease',
  },
  statistics: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  statItem: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
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
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
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

export default Results;