// Certifications used to be stored as plain strings; the schema now expects
// objects. These helpers accept either shape so legacy data keeps rendering.

/** Normalize a certification (string or object) to { name, issuer, date, url }. */
export const normalizeCert = (cert) => {
  if (cert == null) return null;
  if (typeof cert === 'string') {
    const name = cert.trim();
    return name ? { name, issuer: '', date: '', url: '' } : null;
  }
  if (typeof cert !== 'object') return null;
  const name = String(cert.name ?? cert.title ?? '').trim();
  if (!name) return null;
  return {
    name,
    issuer: String(cert.issuer ?? cert.issuedBy ?? '').trim(),
    date: cert.date ? String(cert.date).slice(0, 10) : '',
    url: String(cert.url ?? cert.certificateUrl ?? '').trim(),
  };
};

/** Normalize a list, dropping empty/invalid entries. */
export const normalizeCerts = (list) =>
  (Array.isArray(list) ? list : []).map(normalizeCert).filter(Boolean);

/**
 * Shape sent to PUT /api/students/profile. Sends the new keys
 * ({ name, issuer, date, url }) plus the legacy schema keys
 * ({ title, issuedBy, certificateUrl }) so either schema version stores it;
 * Mongoose drops whichever keys the schema doesn't define.
 */
export const toCertPayload = (cert) => {
  const c = normalizeCert(cert);
  if (!c) return null;
  const payload = { name: c.name, title: c.name };
  if (c.issuer) Object.assign(payload, { issuer: c.issuer, issuedBy: c.issuer });
  if (c.date) payload.date = c.date;
  if (c.url) Object.assign(payload, { url: c.url, certificateUrl: c.url });
  return payload;
};

/** Only allow http(s) links to be rendered as clickable hrefs. */
export const safeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
};

export const certKey = (c, i) => `${c.name}-${c.issuer}-${i}`;
