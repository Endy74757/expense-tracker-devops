import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
