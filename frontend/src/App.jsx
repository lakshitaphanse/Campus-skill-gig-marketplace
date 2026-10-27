import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import Clubs from './pages/Clubs';
import PostGig from './pages/PostGig';
import GigDetail from './pages/GigDetail';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Default redirect to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/opportunities"
            element={
              <ProtectedRoute>
                <Opportunities />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clubs"
            element={
              <ProtectedRoute>
                <Clubs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-gig"
            element={
              <ProtectedRoute allowedRoles={['club']}>
                <PostGig />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gig/:id"
            element={
              <ProtectedRoute>
                <GigDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;