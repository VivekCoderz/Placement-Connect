import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, MailCheck, AlertCircle } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import api from '../utils/api';

// Shown for every syntactically valid email so the page never reveals
// whether an account exists.
const NEUTRAL_MESSAGE =
  "If an account exists for that email, we've sent a password reset link. It expires in 10 minutes.";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: trimmed });
    } catch (err) {
      // Any HTTP response (404 "no user", 500 mail failure, ...) gets the
      // same neutral message. Only a network failure is surfaced.
      if (!err?.response) {
        setError('Cannot reach the server. Check your connection and try again.');
        setIsLoading(false);
        return;
      }
    }
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <AuthShell
      icon={submitted ? MailCheck : KeyRound}
      title={submitted ? 'Check your email' : 'Forgot your password?'}
      subtitle={submitted ? null : "Enter your account email and we'll send you a reset link."}
      footer={
        <Link to="/login" className="font-semibold text-[#0B3D91] hover:underline">
          Back to sign in
        </Link>
      }
    >
      {submitted ? (
        <div className="space-y-4">
          <div className="pc-alert-info" role="status">
            <MailCheck className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p>{NEUTRAL_MESSAGE}</p>
          </div>
          <button type="button" className="pc-btn-secondary w-full" onClick={() => setSubmitted(false)}>
            Use a different email
          </button>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="pc-alert-error" role="alert">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="pc-label">Email address</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              className="pc-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="pc-btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
