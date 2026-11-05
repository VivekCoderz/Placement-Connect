const nodemailer = require("nodemailer");

// SMTP configuration comes only from the environment, so any provider works
// (Brevo, Resend SMTP, Gmail with an app password, ...). See backend/.env.example.
const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
  };
};

const isEmailConfigured = () => getSmtpConfig() !== null;

const getFromAddress = () =>
  process.env.MAIL_FROM || `"Geeta University Placement Cell" <${process.env.SMTP_USER || "no-reply@localhost"}>`;

// Bare email address from MAIL_FROM (used as the ICS organizer).
const getOrganizerEmail = () => {
  const from = getFromAddress();
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).trim();
};

let transporter = null;
let transporterKey = null;

const getTransporter = () => {
  const config = getSmtpConfig();
  const key = JSON.stringify([config.host, config.port, config.secure, config.auth.user]);
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport(config);
    transporterKey = key;
  }
  return transporter;
};

let warnedNotConfigured = false;

/**
 * Send an email.
 * - Resolves { sent: true, messageId } on success.
 * - Resolves { sent: false, skipped: true } (and logs a warning) when SMTP is not configured.
 * - Rejects when the SMTP provider fails, so callers can react (fire-and-forget callers
 *   attach their own .catch()).
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
  if (!isEmailConfigured()) {
    if (!warnedNotConfigured) {
      console.warn("[email] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS); emails are skipped.");
      warnedNotConfigured = true;
    }
    return { sent: false, skipped: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
      attachments,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[email] Failed to send "${subject}":`, error.message);
    throw error;
  }
};

// Generates raw iCalendar (ICS) attachments for interview calendar invitations
const generateICS = ({
  start,
  end,
  summary,
  description,
  location,
  uid,
  studentName,
  studentEmail,
}) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(start);
  const dtend = formatDate(end);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Geeta University//PlacementConnect//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid || Math.random().toString(36).substring(2) + Date.now()}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location || "Online"}
ORGANIZER;CN=Placement Cell:MAILTO:${getOrganizerEmail()}
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${studentName}:MAILTO:${studentEmail}
END:VEVENT
END:VCALENDAR`;
};

module.exports = { sendEmail, generateICS, isEmailConfigured };
