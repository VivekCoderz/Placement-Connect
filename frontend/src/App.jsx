import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { loginState, logoutState, setLoading } from "./store/authSlice";
import api from "./utils/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <PageLoader />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <PageLoader />;
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const PageLoader = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0d1a] relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-25"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-indigo-500/20 mb-4 animate-bounce">
          G
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          PlacementConnect
        </h2>
        <p className="text-xs text-slate-400">Restoring session...</p>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mt-2" />
      </div>
    </div>
  );
};

function AppContent() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const response = await api.get("/auth/me");
        const user = { ...response.data.data.user };
        if (user.role === "company") {
          user.role = "recruiter";
        }
        const details = response.data.data.details;
        dispatch(loginState({ user, details }));
      } catch (error) {
        dispatch(logoutState());
      } finally {
        dispatch(setLoading(false));
      }
    };

    authenticate();
  }, [dispatch]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />  
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppContent />;
}
