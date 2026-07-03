const nodemailer = require("nodemailer");

// Simple Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "vivekgarg0605@gmail.com",
    pass: "tpacprxufwcqdsez",
  },
});

const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    const mailOptions = {
      from: '"Geeta University Placement Cell" <vivekgarg0605@gmail.com>',
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
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
ORGANIZER;CN=Placement Cell:MAILTO:vivekgarg0605@gmail.com
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${studentName}:MAILTO:${studentEmail}
END:VEVENT
END:VCALENDAR`;
};

module.exports = { sendEmail, generateICS };
