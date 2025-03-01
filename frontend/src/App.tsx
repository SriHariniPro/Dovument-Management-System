import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import Upload from './components/Upload';
import Login from './components/Login';
import Register from './components/Register';

const App: React.FC = () => {
  // Simple auth check - replace with your actual auth logic
  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={
            isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />
          } />
          <Route path="documents" element={
            isAuthenticated() ? <Documents /> : <Navigate to="/login" />
          } />
          <Route path="upload" element={
            isAuthenticated() ? <Upload /> : <Navigate to="/login" />
          } />
        </Route>
      </Routes>
    </Router>
  );
};

export default App; 
