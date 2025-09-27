// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CategoryManagement from './pages/CategoryManagement'; // Import the new page
import ReportsPage from './pages/ReportsPage'; // Import the Reports page
import SettingsPage from './pages/SettingsPage'; // Import the Settings page
import Layout from './components/Layout'; // Import the new Layout component
import './App.css';

// A protected route component
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

// Component to handle app logic like re-authentication
const AppContent = () => {
  const { token, user, fetchCurrentUser, logout } = useAuth();

  useEffect(() => {
    // If we have a token but no user data (e.g., after a page refresh),
    // try to fetch the user's data.
    if (token && !user) {
      fetchCurrentUser(token).catch(() => {
        // If the token is invalid or expired, log the user out.
        logout();
      });
    }
  }, [token, user, fetchCurrentUser, logout]); // Dependencies for the effect

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<CategoryManagement />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
    return (
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    );
}

export default App;
