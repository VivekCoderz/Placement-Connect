// Mirrors the backend password policy (backend/validators/schemas.js).
export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';

/** Returns a message describing what is wrong with the password, or '' if it is fine. */
export const passwordProblem = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return '';
};
