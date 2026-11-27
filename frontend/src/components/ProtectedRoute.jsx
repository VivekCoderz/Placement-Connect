import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AuthLoadingOverlay from './AuthLoadingOverlay';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return <AuthLoadingOverlay show title="Checking your session…" subtitle="Just a moment." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'company') return <Navigate to="/recruiter/dashboard" replace />;
    if (user.role === 'placementCell') return <Navigate to="/placement/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/jobs" replace />;
  }

  return children;
};

export default ProtectedRoute;
