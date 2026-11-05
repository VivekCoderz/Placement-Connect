// Wraps an async route handler and forwards any error to the central errorMiddleware,
// which is the single place that decides status codes and client-visible messages.
const ErrorWrapper = (fn) => (req, res, next) => {
  try {
    return Promise.resolve(fn(req, res, next)).catch(next);
  } catch (err) {
    return next(err);
  }
};

module.exports = ErrorWrapper;
