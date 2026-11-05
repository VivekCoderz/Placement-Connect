import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/authSlice';
import AuthShell from '../components/AuthShell';
import api, { getErrorMessage } from '../utils/api';

const homeForRole = (role) => {
  if (role === 'company') return '/recruiter/dashboard';
  if (role === 'placementCell') return '/placement/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
};

const isPendingApproval = (status, message = '') =>
  status === 403 && /pending|approv/i.test(message);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(homeForRole(user.role));
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token } = response.data.data;
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
      navigate(homeForRole(combinedUser.role));
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed');
      if (isPendingApproval(err?.response?.status, message)) {
        localStorage.removeItem('token');
        setPendingMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to PlacementConnect as a student, recruiter or placement officer."
      footer={
        <div className="space-y-2">
          <p>
            New student?{' '}
            <Link to="/signup" className="font-semibold text-[#0B3D91] hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            Recruiting at Geeta University?{' '}
            <Link to="/recruiter/signup" className="font-semibold text-[#0B3D91] hover:underline">
              Register your company
            </Link>
          </p>
        </div>
      }
    >
      {pendingMessage && (
        <div className="pc-alert-warning" role="status">
          <Clock className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Your company account is awaiting approval</p>
            <p className="mt-1 text-xs">
              {pendingMessage.replace(/^Access Denied:\s*/i, '').replace(/\.?$/, '.')} You'll be able to
              sign in once your registration has been approved.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="pc-alert-error" role="alert">
          <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="pc-label">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pc-input pl-10"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="pc-label mb-0">Password</label>
            <Link to="/forgot-password" className="rounded text-xs font-semibold text-[#0B3D91] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pc-input pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>

        <p className="text-[11px] italic text-[#94A3B8]">Demo user: student@pc.com / password123</p>

        <button type="submit" disabled={isLoading} className="pc-btn-primary w-full py-3">
          {isLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-label="Signing in" />
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
