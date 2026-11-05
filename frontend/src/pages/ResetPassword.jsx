import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LockKeyhole, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import api, { getErrorMessage } from '../utils/api';

// Matches the User model's password minlength.
const MIN_LENGTH = 6;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!token) return 'This reset link is invalid. Please request a new one.';
    if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setIsLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${encodeURIComponent(token)}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'This reset link is invalid or has expired. Please request a new one.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell icon={CheckCircle2} title="Password updated">
        <div className="pc-alert-success" role="status">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p>Your password has been reset. Redirecting you to sign in…</p>
        </div>
        <Link to="/login" className="pc-btn-primary w-full">Go to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={LockKeyhole}
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={
        <Link to="/forgot-password" className="font-semibold text-[#0B3D91] hover:underline">
          Need a new reset link?
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="pc-alert-error" role="alert">
            <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}
        <div>
          <label htmlFor="new-password" className="pc-label">New password</label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={MIN_LENGTH}
              className="pc-input pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hint"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 text-slate-500 hover:text-[#0B3D91]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p id="password-hint" className="mt-1.5 text-xs text-[#6B7280]">At least {MIN_LENGTH} characters.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="pc-label">Confirm new password</label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            className="pc-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="pc-btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Updating…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
