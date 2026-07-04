import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { loginState } from "../store/authSlice";
import api from "../utils/api";
import AuthLayout from "../components/AuthLayout";

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Local state for simplified management
  const [loginMethod, setLoginMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear errors when toggling login method
  useEffect(() => {
    setError("");
    setIdentifier("");
  }, [loginMethod]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(`${loginMethod === "email" ? "Email" : "Roll Number"} is required`);
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    const payload = {};
    if (loginMethod === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        setError("Please enter a valid email address");
        return;
      }
      payload.email = identifier.trim();
    } else {
      payload.rollNumber = identifier.trim();
    }

    payload.password = password;

    setIsLoading(true);
    try {
      // 1. Authenticate user (cookie is automatically set by browser)
      const loginRes = await api.post("/auth/login", payload);

      // 2. Fetch full profile (includes student/company details)
      const profileRes = await api.get("/auth/me");
      const user = { ...profileRes.data.data.user };
      if (user.role === "company") {
        user.role = "recruiter";
      }
      const details = profileRes.data.data.details;

      // 3. Update Redux state
      dispatch(loginState({ user, details }));
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials or login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Access the Geeta University placement portal to track applications, post jobs, or manage drives."
    >
      <div className="w-full max-w-md mx-auto space-y-8">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Sign In</h3>
          <p className="text-sm text-slate-400 mt-1">
            Choose your login method below
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
              loginMethod === "email"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Email Address
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("roll")}
            className={`py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
              loginMethod === "roll"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Student Roll Number
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-lg animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-red-300/80 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Identifier Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {loginMethod === "email" ? "Email Address" : "Roll Number"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                {loginMethod === "email" ? (
                  <Mail className="w-5 h-5" />
                ) : (
                  <KeyRound className="w-5 h-5" />
                )}
              </span>
              <input
                type={loginMethod === "email" ? "email" : "text"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  loginMethod === "email" ? "name@geetauniversity.edu.in" : "210304001"
                }
                className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-10 pr-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg pl-10 pr-10 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-300"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg text-sm hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign Up here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
