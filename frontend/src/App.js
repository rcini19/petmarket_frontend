import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import { clearAuthStorage, getValidToken } from './utils/auth';
import './App.css';

function PrivateRoute({ children }) {
  const token = getValidToken();

  if (!token) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const token = getValidToken();
  return token ? <Navigate to="/profile" replace /> : children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
