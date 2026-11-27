import React, { useEffect, useRef, useState } from 'react';

// "Continue with Google" using Google Identity Services. Google returns a signed ID token
// (`credential`) which the backend verifies; no Google secret ever reaches the browser.
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google sign-in'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

/**
 * Renders Google's official button. `onCredential(credential)` is called after the user
 * picks an account. Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured.
 */
const GoogleSignInButton = ({ onCredential, onError, text = 'continue_with', disabled = false }) => {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [loadError, setLoadError] = useState('');

  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential);
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        const width = Math.min(containerRef.current.offsetWidth || 320, 400);
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          width,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError('Google sign-in is unavailable right now.');
        onError?.(err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
        <span className="h-px flex-1 bg-[#E5E7EB]" />
        or
        <span className="h-px flex-1 bg-[#E5E7EB]" />
      </div>
      <div
        ref={containerRef}
        className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={disabled}
      />
      {loadError && <p className="text-center text-xs text-rose-600">{loadError}</p>}
    </div>
  );
};

export default GoogleSignInButton;
