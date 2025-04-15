import React from 'react';
import useAuth from '../../hooks/useAuth';
import './Dashboard.scss';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Welcome to Infrawatch Dashboard</h1>
        <div className="dashboard__user-info">
          <span>Logged in as: {user?.name}</span>
          <button onClick={logout} className="btn btn--outline-primary btn--sm">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard__content">
        <div className="dashboard__placeholder">
          <h2>Dashboard Placeholder</h2>
          <p>This is a placeholder for the Infrawatch dashboard. It will display VM monitoring, infrastructure status, and performance metrics in future phases.</p>
          
          <div className="dashboard__user-details">
            <h3>Current User Details:</h3>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;