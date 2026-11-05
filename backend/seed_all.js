const mongoose = require("mongoose");
const User = require("./models/User");
const Student = require("./models/student");
const Company = require("./models/company");
const Job = require("./models/job");
const Application = require("./models/application");
const Notification = require("./models/notification");
const Message = require("./models/message");
require("dotenv").config();
const { assertSafeTarget } = require("./scripts/guard");

// DESTRUCTIVE: wipes Users, Students, Companies, Jobs, Applications, Notifications and
// Messages, then loads demo data. Only for local development:
//   NODE_ENV=development MONGO_URI=mongodb://127.0.0.1:27017/placementconnect-dev \
//   SEED_PASSWORD='choose-a-demo-password' npm run seed:demo
// All demo accounts share SEED_PASSWORD.
const SEED_PASSWORD = process.env.SEED_PASSWORD;

const run = async () => {
  const uri = assertSafeTarget({ scriptName: "seed_all", destructive: true });
  if (!SEED_PASSWORD || SEED_PASSWORD.length < 8) {
    console.error("SEED_PASSWORD (min 8 characters) must be set for the demo accounts.");
    process.exit(1);
  }
  
  await mongoose.connect(uri);
  console.log("Connected to MongoDB database for seeding...");

  // 1. Clean existing records
  console.log("Clearing existing collections...");
  await User.deleteMany({});
  await Student.deleteMany({});
  await Company.deleteMany({});
  await Job.deleteMany({});
  await Application.deleteMany({});
  await Notification.deleteMany({});
  await Message.deleteMany({});

  // 2. Seed Admin & Placement Cell accounts
  console.log("Seeding system accounts...");
  
  const adminUser = new User({
    name: "System Administrator",
    email: "admin@placementconnect.com",
    password: SEED_PASSWORD,
    role: "admin",
    isActive: true
  });
  await adminUser.save();

  const cellUser = new User({
    name: "Placement Cell Staff",
    email: "placementcell@placementconnect.com",
    password: SEED_PASSWORD,
    role: "placementCell",
    isActive: true
  });
  await cellUser.save();

  // 3. Seed Recruiters & Company Profiles
  console.log("Seeding companies and recruiter accounts...");

  const googleRecruiter = new User({
    name: "Sundar Pichai",
    email: "recruiter.google@placementconnect.com",
    password: SEED_PASSWORD,
    role: "company",
    isApproved: true,
    isActive: true
  });
  await googleRecruiter.save();

  const googleCompany = new Company({
    name: "Google LLC",
    recruiterId: googleRecruiter._id,
    recruiterEmail: googleRecruiter.email,
    industry: "Technology / Internet",
    approved: true
  });
  await googleCompany.save();

  const microsoftRecruiter = new User({
    name: "Satya Nadella",
    email: "recruiter.microsoft@placementconnect.com",
    password: SEED_PASSWORD,
    role: "company",
    isApproved: true,
    isActive: true
  });
  await microsoftRecruiter.save();

  const microsoftCompany = new Company({
    name: "Microsoft India",
    recruiterId: microsoftRecruiter._id,
    recruiterEmail: microsoftRecruiter.email,
    industry: "Enterprise Software / Cloud",
    approved: true
  });
  await microsoftCompany.save();

  const tcsRecruiter = new User({
    name: "Rajesh Gopinathan",
    email: "recruiter.tcs@placementconnect.com",
    password: SEED_PASSWORD,
    role: "company",
    isApproved: true,
    isActive: true
  });
  await tcsRecruiter.save();

  const tcsCompany = new Company({
    name: "Tata Consultancy Services",
    recruiterId: tcsRecruiter._id,
    recruiterEmail: tcsRecruiter.email,
    industry: "IT Services / Consulting",
    approved: true
  });
  await tcsCompany.save();

  // 4. Seed Job Placement Drives
  console.log("Seeding recruitment jobs...");

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30); // 30 days in future

  const googleJob = new Job({
    title: "Software Engineer Intern",
    companyId: googleCompany._id,
    description: "Looking for students skilled in Algorithms, System Design, and Full Stack development. Will work on critical web products.",
    package: 24, // 24 LPA
    eligibility: {
      cgpa: 8.0,
      branches: ["Computer Science & Engineering", "Information Technology"],
      years: [2026, 2027]
    },
    deadline,
    status: "active"
  });
  await googleJob.save();
  googleCompany.jobPostings.push(googleJob._id);
  await googleCompany.save();

  const microsoftJob = new Job({
    title: "Support Cloud Engineer",
    companyId: microsoftCompany._id,
    description: "Help customers debug Azure services and design cloud solutions using Node.js/C#.",
    package: 18, // 18 LPA
    eligibility: {
      cgpa: 7.5,
      branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering"],
      years: [2026, 2027]
    },
    deadline,
    status: "active"
  });
  await microsoftJob.save();
  microsoftCompany.jobPostings.push(microsoftJob._id);
  await microsoftCompany.save();

  const tcsJob = new Job({
    title: "Systems Engineer Trainee",
    companyId: tcsCompany._id,
    description: "Mass recruitment drive for software implementation engineers across different business units.",
    package: 4.5, // 4.5 LPA
    eligibility: {
      cgpa: 6.0,
      branches: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering", "Mechanical Engineering", "Civil Engineering"],
      years: [2026, 2027]
    },
    deadline,
    status: "active"
  });
  await tcsJob.save();
  tcsCompany.jobPostings.push(tcsJob._id);
  await tcsCompany.save();

  // 5. Seed Students
  console.log("Seeding student accounts and profile spaces...");

  // CSE Student -> Placed at Google
  const studentCseUser = new User({
    name: "Shivam Kumar",
    email: "student.cse@placementconnect.com",
    password: SEED_PASSWORD,
    role: "student",
    isActive: true
  });
  await studentCseUser.save();

  const studentCseDetails = new Student({
    userId: studentCseUser._id,
    name: studentCseUser.name,
    email: studentCseUser.email,
    branch: "Computer Science & Engineering",
    year: 2026,
    rollNumber: "CSE/2022/045",
    cgpa: 9.2,
    phone: "+91 99999 88888",
    skills: ["React.js", "Node.js", "MongoDB", "Express.js", "C++", "Docker"],
    projects: [
      {
        title: "Campus Placement Management System",
        description: "Built CPMS with custom analytics dashboards and resume builder PDF templates.",
        techStack: ["React", "Express", "Node", "MongoDB"],
        link: "https://github.com/shivam/placement-connect"
      }
    ],
    isPlaced: true
  });
  await studentCseDetails.save();

  // IT Student -> Placed at Microsoft
  const studentItUser = new User({
    name: "Rahul Sharma",
    email: "student.it@placementconnect.com",
    password: SEED_PASSWORD,
    role: "student",
    isActive: true
  });
  await studentItUser.save();

  const studentItDetails = new Student({
    userId: studentItUser._id,
    name: studentItUser.name,
    email: studentItUser.email,
    branch: "Information Technology",
    year: 2026,
    rollNumber: "IT/2022/012",
    cgpa: 8.5,
    phone: "+91 88888 77777",
    skills: ["Python", "Django", "Azure", "JavaScript", "SQL"],
    projects: [
      {
        title: "Cloud Backup Automation Service",
        description: "Designed a secure daemon script that streams local directory back ups to Azure blob containers.",
        techStack: ["Python", "Azure SDK", "Docker"]
      }
    ],
    isPlaced: true
  });
  await studentItDetails.save();

  // ECE Student -> Shortlisted at TCS
  const studentEceUser = new User({
    name: "Aman Verma",
    email: "student.ece@placementconnect.com",
    password: SEED_PASSWORD,
    role: "student",
    isActive: true
  });
  await studentEceUser.save();

  const studentEceDetails = new Student({
    userId: studentEceUser._id,
    name: studentEceUser.name,
    email: studentEceUser.email,
    branch: "Electronics & Communication Engineering",
    year: 2026,
    rollNumber: "ECE/2022/078",
    cgpa: 7.8,
    phone: "+91 77777 66666",
    skills: ["Embedded C", "Arduino", "Internet of Things", "SQL"],
    isPlaced: false
  });
  await studentEceDetails.save();

  // ME Student -> Applied at TCS
  const studentMeUser = new User({
    name: "Vikram Singh",
    email: "student.me@placementconnect.com",
    password: SEED_PASSWORD,
    role: "student",
    isActive: true
  });
  await studentMeUser.save();

  const studentMeDetails = new Student({
    userId: studentMeUser._id,
    name: studentMeUser.name,
    email: studentMeUser.email,
    branch: "Mechanical Engineering",
    year: 2026,
    rollNumber: "ME/2022/032",
    cgpa: 6.9,
    phone: "+91 66666 55555",
    skills: ["SolidWorks", "AutoCAD", "MATLAB"],
    isPlaced: false
  });
  await studentMeDetails.save();

  // CE Student -> Rejected from Google (failed requirements)
  const studentCeUser = new User({
    name: "Deepak Kumar",
    email: "student.ce@placementconnect.com",
    password: SEED_PASSWORD,
    role: "student",
    isActive: true
  });
  await studentCeUser.save();

  const studentCeDetails = new Student({
    userId: studentCeUser._id,
    name: studentCeUser.name,
    email: studentCeUser.email,
    branch: "Civil Engineering",
    year: 2026,
    rollNumber: "CE/2022/015",
    cgpa: 7.2,
    phone: "+91 55555 44444",
    skills: ["STAAD Pro", "Revit", "Surveying"],
    isPlaced: false
  });
  await studentCeDetails.save();

  // 6. Seed Applications
  console.log("Seeding application links and rounds details...");

  // Shivam (CSE) selected at Google
  const appCse = new Application({
    studentId: studentCseDetails._id,
    jobId: googleJob._id,
    status: "Selected",
    rounds: [
      { name: "Applied", result: "Passed", scheduledAt: new Date(), notes: "Eligible CGPA" },
      { name: "Aptitude Round", result: "Passed", scheduledAt: new Date(), notes: "Score: 92%" },
      { name: "Technical Round", result: "Passed", scheduledAt: new Date(), notes: "DSA cleared" },
      { name: "HR Round", result: "Passed", scheduledAt: new Date(), notes: "Fitment check passed" }
    ],
    offerLetterUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  });
  await appCse.save();

  // Rahul (IT) selected at Microsoft
  const appIt = new Application({
    studentId: studentItDetails._id,
    jobId: microsoftJob._id,
    status: "Selected",
    rounds: [
      { name: "Applied", result: "Passed", scheduledAt: new Date(), notes: "Eligible CGPA" },
      { name: "Technical round", result: "Passed", scheduledAt: new Date(), notes: "Azure knowledge verified" }
    ],
    offerLetterUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  });
  await appIt.save();

  // Aman (ECE) shortlisted at TCS
  const appEce = new Application({
    studentId: studentEceDetails._id,
    jobId: tcsJob._id,
    status: "Shortlisted",
    rounds: [
      { name: "Applied", result: "Passed", scheduledAt: new Date(), notes: "Eligible CGPA" },
      { name: "Aptitude Round", result: "Passed", scheduledAt: new Date(), notes: "Score: 78%" },
      { name: "GD Round", result: "Pending", scheduledAt: new Date() }
    ]
  });
  await appEce.save();

  // Vikram (ME) applied at TCS
  const appMe = new Application({
    studentId: studentMeDetails._id,
    jobId: tcsJob._id,
    status: "Applied",
    rounds: [
      { name: "Applied", result: "Pending", scheduledAt: new Date() }
    ]
  });
  await appMe.save();

  // Deepak (CE) applied at Google (but recruiter rejects it)
  const appCe = new Application({
    studentId: studentCeDetails._id,
    jobId: googleJob._id,
    status: "Rejected",
    rounds: [
      { name: "Applied", result: "Failed", scheduledAt: new Date(), notes: "Branch criteria failed" }
    ]
  });
  await appCe.save();

  // 7. Seed Notifications
  console.log("Seeding in-app alert notifications...");

  const notif1 = new Notification({
    userId: studentCseUser._id,
    message: "Congratulations! You have been selected for Software Engineer Intern at Google LLC.",
    type: "application_status"
  });
  await notif1.save();

  const notif2 = new Notification({
    userId: studentEceUser._id,
    message: "Interview Scheduled: Aptitude Round has been passed. GD Round is scheduled.",
    type: "interview_scheduled"
  });
  await notif2.save();

  console.log("Database seeded successfully with all mock entities!");
  console.log("Test Logins available:");
  console.log("- Admin: admin@placementconnect.com (password: $SEED_PASSWORD)");
  console.log("- Coordinator: placementcell@placementconnect.com (password: $SEED_PASSWORD)");
  console.log("- Student (CSE): student.cse@placementconnect.com (password: $SEED_PASSWORD)");
  console.log("- Student (IT): student.it@placementconnect.com (password: $SEED_PASSWORD)");
  console.log("- Recruiter (Google): recruiter.google@placementconnect.com (password: $SEED_PASSWORD)");

  await mongoose.disconnect();
};

run().catch(console.error);
