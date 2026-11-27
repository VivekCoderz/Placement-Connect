// Defence against NoSQL operator injection: drop any object key that starts with "$"
// or contains "." from request bodies and route params before they reach a query,
// e.g. {"email": {"$ne": null}}. Zod schemas already cover most routes; this protects
// every route, including ones without a schema.
const MAX_DEPTH = 20;

const isUnsafeKey = (key) => key.startsWith("$") || key.includes(".");

const strip = (value, depth = 0) => {
  if (depth > MAX_DEPTH || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      value[i] = strip(item, depth + 1);
    });
    return value;
  }
  for (const key of Object.keys(value)) {
    if (isUnsafeKey(key)) {
      delete value[key];
    } else {
      value[key] = strip(value[key], depth + 1);
    }
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") strip(req.body);
  if (req.params && typeof req.params === "object") strip(req.params);
  next();
};

module.exports = sanitizeInput;
