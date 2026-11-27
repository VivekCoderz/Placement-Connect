import api from './api';
import { setUser } from '../redux/authSlice';

/** Where each role lands after signing in. */
export const homeForRole = (role) => {
  if (role === 'company') return '/recruiter/dashboard';
  if (role === 'placementCell') return '/placement/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
};

/**
 * Store the session token, load the full profile from /me and put it in Redux.
 * Returns the combined user object.
 */
export const completeSignIn = async (token, dispatch) => {
  localStorage.setItem('token', token);

  const meResponse = await api.get('/api/auth/me');
  const me = meResponse.data.data;
  const combinedUser = {
    ...me.user,
    ...me.details,
    id: me.user._id || me.user.id,
  };

  localStorage.setItem('user', JSON.stringify(combinedUser));
  dispatch(setUser(combinedUser));
  return combinedUser;
};

/** Forget the local session (the server cookie is cleared by /logout). */
export const clearLocalSession = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // storage unavailable
  }
};
