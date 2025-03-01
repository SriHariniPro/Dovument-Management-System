import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Upload } from './pages/Upload';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuthStore } from './stores/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          !isAuthenticated ? <Login /> : <Navigate to="/dashboard" />
        } />
        <Route path="/register" element={
          !isAuthenticated ? <Register /> : <Navigate to="/dashboard" />
        } />

        {/* Protected routes */}
        <Route path="/" element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="upload" element={<Upload />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App; 