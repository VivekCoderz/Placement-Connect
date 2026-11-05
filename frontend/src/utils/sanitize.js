import DOMPurify from "dompurify";

/**
 * Sanitize untrusted HTML (offer letters, reports) before it reaches the DOM.
 * Scripts, event handlers and javascript: URLs are stripped.
 */
export const sanitizeHtml = (html) =>
  DOMPurify.sanitize(typeof html === "string" ? html : "", {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc"],
  });

/** Escape a plain-text value for safe use inside an HTML string. */
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Write a printable document into a window opened with window.open('').
 * `body` is sanitized; `styles` must be trusted, static CSS.
 * Returns false if the window could not be opened (popup blocked).
 */
export const writePrintDocument = (printWindow, { title = "", styles = "", body = "" }) => {
  if (!printWindow) {
    alert("Please allow pop-ups for this site to print or save as PDF.");
    return false;
  }
  const doc = printWindow.document;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
      `<style>${styles}</style></head><body>${sanitizeHtml(body)}</body></html>`
  );
  doc.close();
  // Print from the opener: inline scripts in the print body are stripped by design.
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // ignore: the user can still print manually
    }
  }, 300);
  return true;
};
