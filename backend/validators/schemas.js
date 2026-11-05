const { z } = require("zod");
const mongoose = require("mongoose");

const objectId = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), { message: "Invalid id" });

const email = z.string().trim().toLowerCase().email("Invalid email").max(254);
const password = z.string().min(6, "Password must be at least 6 characters").max(128);
const shortText = (max = 200) => z.string().trim().max(max);

// ---------- Auth ----------
// `role` is validated in the controller so that staff roles get an explicit 403.
const registerSchema = z
  .object({
    name: shortText(50).min(3, "Name must be at least 3 characters"),
    email,
    password,
    role: z.string().trim(),
    // Student fields
    branch: shortText(100).optional(),
    year: z.coerce.number().int().min(1).max(6).optional(),
    rollNumber: shortText(50).optional(),
    cgpa: z.coerce.number().min(0).max(10).optional(),
    phone: shortText(20).optional(),
    // Company fields
    companyName: shortText(150).optional(),
    industry: shortText(100).optional(),
    website: shortText(300).optional(),
    hrContactName: shortText(100).optional(),
    hrContactPhone: shortText(20).optional(),
    address: shortText(500).optional(),
  })
  .strip();

const loginSchema = z
  .object({
    email: email.optional(),
    rollNumber: shortText(50).optional(),
    password: z.string().min(1, "Please provide a password").max(128),
  })
  .refine((body) => body.email || body.rollNumber, {
    message: "Please provide either email or roll number",
  });

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({ password });

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1).max(128),
  newPassword: password,
});

// ---------- Admin ----------
const createStaffSchema = z.object({
  name: shortText(50).min(3),
  email,
  password: z.string().min(10, "Staff passwords must be at least 10 characters").max(128),
  role: z.enum(["admin", "placementCell"]),
});

const academicUpdateSchema = z
  .object({
    cgpa: z.coerce.number().min(0).max(10).optional(),
    branch: shortText(100).min(1).optional(),
    year: z.coerce.number().int().min(1).max(6).optional(),
    rollNumber: shortText(50).min(1).optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "Provide at least one of cgpa, branch, year, rollNumber",
  });

// ---------- Student profile ----------
// Certifications accept either plain strings (current frontend) or objects.
const certification = z.union([
  shortText(200).min(1),
  z
    .object({
      title: shortText(200).optional(),
      name: shortText(200).optional(),
      issuedBy: shortText(200).optional(),
      certificateUrl: shortText(500).optional(),
    })
    .strip(),
]);

const project = z
  .object({
    title: shortText(200).min(1),
    description: shortText(5000).optional(),
    techStack: z.union([z.array(shortText(100)).max(50), shortText(500)]).optional(),
    link: shortText(500).optional(),
  })
  .strip();

const profileUpdateSchema = z
  .object({
    phone: shortText(20).optional(),
    skills: z.array(shortText(100)).max(100).optional(),
    projects: z.array(project).max(50).optional(),
    certifications: z.array(certification).max(50).optional(),
  })
  .strip();

// ---------- Company: rounds ----------
const roundBase = {
  name: shortText(150).min(1),
  description: shortText(5000).optional(),
  date: z.union([z.string(), z.null()]).optional(),
  time: shortText(50).optional(),
  mode: z.enum(["Online", "Physical"]).optional(),
  meetingLink: shortText(500).optional(),
  platform: shortText(100).optional(),
  instructions: shortText(5000).optional(),
};

const createRoundSchema = z.object(roundBase).strip();
const updateRoundSchema = z.object({ ...roundBase, name: roundBase.name.optional() }).strip();

const manualResultsSchema = z.object({
  results: z
    .array(
      z.object({
        studentId: objectId,
        result: z.enum(["Selected", "Rejected", "Absent", "Waiting"]),
        score: z.coerce.number().optional(),
        remarks: shortText(2000).optional(),
      }),
    )
    .min(1, "results array is required and cannot be empty")
    .max(1000),
});

const overrideSchema = z.object({
  status: z.enum(["Shortlisted", "Rejected"], {
    errorMap: () => ({ message: "Invalid status override. Must be Shortlisted or Rejected" }),
  }),
  reason: shortText(2000).optional(),
});

module.exports = {
  objectId,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createStaffSchema,
  academicUpdateSchema,
  profileUpdateSchema,
  createRoundSchema,
  updateRoundSchema,
  manualResultsSchema,
  overrideSchema,
};
