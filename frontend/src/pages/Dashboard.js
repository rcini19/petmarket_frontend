import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="dashboard-logo">🐾</span>
          <h1>PetMarket</h1>
        </div>
        <div className="dashboard-user">
          <span className="user-name">Welcome, {user.fullName || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Log out
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        <h2>Dashboard</h2>
        <p>Welcome to PetMarket! This is your dashboard.</p>
      </main>
    </div>
  );
}

export default Dashboard;
