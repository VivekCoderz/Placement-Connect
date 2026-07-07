import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/authSlice';
import api from '../utils/api';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'company') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const loginRes = response.data;

      const { token } = loginRes.data;
      localStorage.setItem('token', token);

      const meResponse = await api.get('/api/auth/me');
      const meRes = meResponse.data;

      const combinedUser = {
        ...meRes.data.user,
        ...meRes.data.details,
        id: meRes.data.user._id || meRes.data.user.id,
      };

      localStorage.setItem('user', JSON.stringify(combinedUser));
      dispatch(setUser(combinedUser));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-6 sm:px-8 relative overflow-hidden">
      {/* Premium Ambient Background Animations (Floating Green/Teal Gradient Orbs) */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/10 blur-[100px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-400/10 blur-[100px] pointer-events-none animate-float-medium" />

      {/* Main Login Card - Entrance Animation */}
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-md border border-slate-200/80 p-10 sm:p-12 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 animate-slide-up">
        
        {/* Header - Staggered Slide Up */}
        <div className="text-center space-y-3 animate-slide-up animation-delay-100">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-555 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LogIn className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500">
            Sign in to your student account on{' '}
            <span className="text-emerald-600 font-bold">PlacementConnect</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-600 text-sm items-start animate-slide-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Form Area */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Email Field - Staggered Slide Up */}
            <div className="animate-slide-up animation-delay-100">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="student@university.com"
                />
              </div>
            </div>

            {/* Password Field - Staggered Slide Up */}
            <div className="animate-slide-up animation-delay-200">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Hint details - Staggered Slide Up */}
          <div className="flex items-center justify-between text-xs text-slate-400 animate-slide-up animation-delay-200">
            <span className="text-slate-450 italic font-medium">Demo user: student@pc.com / password123</span>
          </div>

          {/* Submit Button - Hover and Focus animations */}
          <div className="animate-slide-up animation-delay-300">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-emerald-650/15 hover:shadow-lg hover:shadow-emerald-650/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        {/* Signup Redirect links */}
        <div className="text-center mt-6 space-y-2 animate-slide-up animation-delay-300">
          <p className="text-sm text-slate-500 font-semibold">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-650 hover:text-emerald-500 font-bold transition-colors">
              Register here
            </Link>
          </p>
          <p className="text-xs text-slate-400 font-semibold border-t border-slate-200/60 pt-3">
            Are you a recruiter?{' '}
            <Link to="/recruiter/signup" className="text-cyan-600 hover:text-cyan-500 font-bold transition-colors">
              Register your company
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
