const sanitizeHtmlLib = require("sanitize-html");

// Conservative allowlist for recruiter-authored rich text (offer letters, templates,
// recruiter emails). No scripts, event handlers, styles, iframes, forms or images.
const OPTIONS = {
  allowedTags: [
    "p", "br", "hr", "div", "span",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "small", "sub", "sup",
    "blockquote", "pre", "code",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer nofollow" }, true),
  },
};

const sanitizeHtml = (html) => {
  if (html === undefined || html === null) return html;
  return sanitizeHtmlLib(String(html), OPTIONS);
};

module.exports = { sanitizeHtml };
