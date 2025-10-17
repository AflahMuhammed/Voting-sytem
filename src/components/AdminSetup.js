// components/AdminSetup.jsx
import React, { useState } from 'react';
import './Auth.css';

const AdminSetup = ({ onSetup }) => {
  const [formData, setFormData] = useState({
    email: 'admin@votingapp.com',
    password: 'secureAdmin123',
    firstName: 'System',
    lastName: 'Administrator'
  });
  const [isSetup, setIsSetup] = useState(false);

  const handleSetup = () => {
    const adminUser = {
      id: 'admin-001',
      ...formData,
      role: 'admin',
      token: 'mock-admin-token-001',
      votes: 0,
      joinedDate: new Date().toISOString()
    };

    onSetup(adminUser);
    setIsSetup(true);
  };

  const handleContinue = () => {
    // Since we're outside Router context, we'll reload the page
    // which will trigger the normal app flow with authentication
    window.location.href = '/dashboard';
  };

  if (isSetup) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>✅ Admin Account Created</h1>
            <p>Administrator account has been set up successfully.</p>
          </div>
          <div className="success-message">
            <p>You have been automatically logged in as administrator.</p>
          </div>
          <div className="demo-accounts">
            <h3>Your Admin Credentials:</h3>
            <div className="demo-account">
              <strong>Email:</strong> {formData.email}
            </div>
            <div className="demo-account">
              <strong>Password:</strong> {formData.password}
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <strong>Important:</strong> Save these credentials in a secure place.
            </p>
          </div>
          <button 
            className="btn btn-primary auth-btn"
            onClick={handleContinue}
            style={{ marginTop: '2rem' }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔧 Initial Setup Required</h1>
          <p>Create the administrator account for your voting system</p>
        </div>
        
        <div className="setup-info">
          <p>This is a one-time setup to create the first administrator account.</p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              placeholder="Administrator first name"
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              placeholder="Administrator last name"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Admin email address"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="text" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Set a secure password"
            />
          </div>
          
          <div className="security-notice">
            <h4>🔒 Security Notice</h4>
            <ul>
              <li>This account will have full system administrator privileges</li>
              <li>Choose a strong, unique password</li>
              <li>You can create additional admin accounts later</li>
              <li>Regular users will sign up through the registration form</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary auth-btn" 
            onClick={handleSetup}
            style={{ backgroundColor: '#27ae60', borderColor: '#27ae60' }}
          >
            Create Administrator Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;