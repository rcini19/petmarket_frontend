import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import BrowsePets from '../pages/BrowsePets/BrowsePets';
import PetDetail from '../pages/PetDetail/PetDetail';
import ListingForm from '../pages/ListingForm/ListingForm';
import MyPets from '../pages/MyPets/MyPets';
import Trades from '../pages/Trades/Trades';
import AdminPanel from '../pages/AdminPanel/AdminPanel';
import { clearAuthStorage, getValidToken, hasRole } from '../utils/auth';
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

function AdminRoute({ children }) {
  const token = getValidToken();
  if (!token) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  if (!hasRole('ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/browse" element={<PrivateRoute><BrowsePets /></PrivateRoute>} />
        <Route path="/pets/new" element={<PrivateRoute><ListingForm /></PrivateRoute>} />
        <Route path="/pets/:id/edit" element={<PrivateRoute><ListingForm /></PrivateRoute>} />
        <Route path="/pets/:id" element={<PrivateRoute><PetDetail /></PrivateRoute>} />
        <Route path="/my-pets" element={<PrivateRoute><MyPets /></PrivateRoute>} />
        <Route path="/trades" element={<PrivateRoute><Trades /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
