import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, setLoading } from './redux/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import api from './utils/api';

// Eagerly loaded: the public entry points.
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PageLoader from './components/PageLoader';

// Route-level code splitting: each of these becomes its own chunk.
const Signup = lazy(() => import('./pages/Signup'));
const RecruiterSignup = lazy(() => import('./pages/RecruiterSignup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const JobListings = lazy(() => import('./pages/JobListings'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Applications = lazy(() => import('./pages/Applications'));
const Notifications = lazy(() => import('./pages/Notifications'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));
const PlacementDashboard = lazy(() => import('./pages/PlacementDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

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
      <Suspense fallback={<PageLoader />}>
      <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recruiter/signup" element={<RecruiterSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
