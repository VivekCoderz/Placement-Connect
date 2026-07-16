import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setLoading } from './redux/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import api from './utils/api';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import JobListings from './pages/JobListings';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import Notifications from './pages/Notifications';
import RecruiterSignup from './pages/RecruiterSignup';
import RecruiterDashboard from './pages/RecruiterDashboard';
import PlacementDashboard from './pages/PlacementDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        dispatch(setLoading(true));
        try {
          const response = await api.get('/api/auth/me');
          const meData = response.data;
          const combinedUser = {
            ...meData.data.user,
            ...meData.data.details,
            id: meData.data.user._id || meData.data.user.id,
          };
          dispatch(setUser(combinedUser));
          localStorage.setItem('user', JSON.stringify(combinedUser));
        } catch (err) {
          console.error("Session restore failed:", err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    restoreSession();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recruiter/signup" element={<RecruiterSignup />} />

          {/* Protected Recruiter Portal Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <Layout>
                  <RecruiterDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/placement/dashboard"
            element={
              <ProtectedRoute allowedRoles={['placementCell']}>
                <Layout>
                  <PlacementDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Student Portal Routes */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <JobListings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <JobDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['student', 'company', 'placementCell']}>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
