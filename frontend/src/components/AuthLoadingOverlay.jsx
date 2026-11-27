import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

// After this long, explain the wait: the free Render backend sleeps when idle and the
// first request can take up to a minute while it starts.
const SLOW_AFTER_MS = 5000;

/** Full-screen "please wait" shown while signing in or creating an account. */
const AuthLoadingOverlay = ({ show, title = 'Signing you in…', subtitle = 'Hang tight, setting up your dashboard.' }) => {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!show) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC]/85 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="pc-card w-full max-w-sm p-8 text-center shadow-xl animate-slide-up">
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 rounded-full border-4 border-[#0B3D91]/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#0B3D91]" />
          <span className="absolute inset-0 flex items-center justify-center text-[#0B3D91]">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-5 text-lg font-bold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm text-[#4B5563]">{subtitle}</p>
        {slow && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            The server is waking up. This can take up to a minute the first time, please don't close this page.
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
