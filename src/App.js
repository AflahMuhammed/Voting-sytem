// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import VotingBooth from './components/VotingBooth';
import Results from './components/Results';
import AdminPanel from './components/AdminPanel';
import AdminSetup from './components/AdminSetup';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsAdminSetup, setNeedsAdminSetup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const adminAccount = localStorage.getItem('adminAccount');
    
    // Check if admin setup is needed (no admin account exists)
    if (!adminAccount) {
      setNeedsAdminSetup(true);
    }
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleSignup = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleAdminSetup = (adminData) => {
    setNeedsAdminSetup(false);
    localStorage.setItem('adminAccount', JSON.stringify(adminData));
    // Auto-login as admin after setup
    handleLogin(adminData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const LoadingSpinner = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem',
      flexDirection: 'column'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}></div>
      <p>Loading Voting System...</p>
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

  if (loading) {
    return <LoadingSpinner />;
  }

  // If admin setup is needed, show the setup component directly (without Router)
  if (needsAdminSetup && !isAuthenticated) {
    return (
      <AdminSetup onSetup={handleAdminSetup} />
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin Setup Route - kept for manual access if needed */}
          <Route 
            path="/setup-admin" 
            element={
              !isAuthenticated && needsAdminSetup ? (
                <AdminSetup onSetup={handleAdminSetup} />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/signup" 
            element={
              !isAuthenticated ? (
                <Signup onSignup={handleSignup} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              isAuthenticated && user?.role === 'admin' ? (
                <AdminPanel user={user} onLogout={handleLogout} />
              ) : isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/vote/:electionId" 
            element={
              isAuthenticated ? (
                <VotingBooth user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/results/:electionId" 
            element={
              isAuthenticated ? (
                <Results user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/results" 
            element={
              isAuthenticated ? (
                <Results user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;