# PlacementConnect

### Student–Recruiter Placement Management System
**"Bridge the gap between Students and Recruiters on one smart platform"**

Geeta University · Department of Computer Science & Engineering
MERN Stack Full-Stack Internship Project — Group 3 (4 Members)

![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)
![JWT](https://img.shields.io/badge/JWT-black?style=flat&logo=JSON-web-tokens)

---

## 📖 About The Project

PlacementConnect is a full-featured campus placement platform built for Geeta University that digitizes and streamlines the entire placement cycle. Currently, placement activities are managed manually through emails, Excel sheets, and informal notifications — leading to missed deadlines, no real-time tracking, and zero centralized visibility for leadership.

This platform gives:
- **Students** a profile/portfolio space to showcase academics, skills, and projects
- **Companies** a portal to post jobs, view student profiles, and manage hiring rounds
- **Placement Cell Staff** tools to manage drives, shortlists, and approvals
- **HODs/Leadership** real-time placement statistics and reports

Think of it as a **LinkedIn-meets-placement-portal**, built specifically for Geeta University's ecosystem.

---

## 🧑‍🤝‍🧑 Client Details

| Field | Value |
|---|---|
| Client | Geeta University Training & Placement Cell |
| Contact | Placement Officer / TPO |
| Project Type | Placement Management Web Application |
| Target Users | Students, Company Recruiters, Placement Cell Staff, HODs |
| Budget Scope | Academic / Internal Internship Project |

---

## ✨ Features

### 🎓 Student Module
- **Student Profile** — Academic details, resume upload, skills, projects, certifications (stored via Cloudinary + MongoDB)
- **Job Listings** — Browse eligible drives filtered by CGPA and branch (MongoDB aggregation)
- **Apply & Track** — One-click apply, live application status tracking (Applied / Shortlisted / Selected)
- **My Applications Timeline** — Visual timeline: Applied → Aptitude → GD → HR → Selected/Rejected
- **Resume Builder** *(Nice-to-Have)* — In-app resume builder with university-approved template, export via React-to-PDF

### 🏢 Company / Recruiter Module
- **Company Registration** — Recruiters register and await admin approval (role-based auth)
- **Job Posting** — Post jobs with eligibility criteria (CGPA, branch, year), CTC, JD, and deadline
- **Application Review** — View and manage all applicants for a posted job
- **Shortlist Management** — Upload round-wise shortlists (Aptitude/GD/HR) via CSV upload & parsing
- **Result Announcement** — Declare final selections with offer letter PDF upload

### 🏫 Placement Cell / Admin Module
- **Admin Control Panel** — Approve/reject company registrations, manage all drives and students
- **Placement Cell Panel** — Centralized view of all drives, applications, and shortlists
- **Placement Analytics** — Branch-wise, company-wise, and package-wise placement statistics (Chart.js — bar & pie charts)
- **HOD Dashboard** *(Nice-to-Have)* — Branch-wise placement progress view for department heads

### 🔔 Platform-Wide Features
- **Real-Time Notifications** — In-app alerts via Socket.io + email notifications via Nodemailer for every stage update
- **Interview Scheduling** — Schedule interviews per student, send calendar invites via email (ICS format)
- **Role-Based Authentication** — Secure JWT-based auth for 4 distinct roles: Student, Recruiter, Placement Cell, Admin
- **Notification Center** — Chronological list of all notifications with read/unread state

---

## 🗂️ Feature Priority

| Priority | Meaning |
|---|---|
| **P0** | Must Have — core functionality, required for a working product |
| **P1** | Should Have — important, adds significant value |
| **P2** | Nice to Have — bonus, implemented if time permits |

---

## 🖥️ Screens / Pages

| Screen | Description |
|---|---|
| Student Home | Eligible drives list, application status tracker, notifications bell |
| Student Profile | Edit academic info, upload resume, add skills/projects, preview profile |
| Drive Detail | Company info, JD, package, eligibility, rounds info, Apply button |
| My Applications | Timeline view of application progress |
| Company Dashboard | Post new job, view applications, upload shortlists, mark results |
| Company Job Form | Job title, JD, CTC, eligibility (CGPA/branch/year), deadline |
| Placement Cell Panel | All drives, all applications, shortlist upload, statistics view |
| Analytics Page | Branch-wise bar chart, company-wise pie chart |
| Admin Panel | Approve companies, manage students, system settings |
| Notification Center | All notifications in chronological order |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js (Vite), React Router v6, Redux Toolkit, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js, REST API architecture, Multer (file uploads) |
| **Database** | MongoDB (Atlas), Mongoose ODM, database indexing |
| **Authentication** | JSON Web Tokens (JWT), bcrypt.js, Role-Based Access Control (RBAC) |
| **Other Services** | Nodemailer (email), Cloudinary (media storage), Socket.io (real-time) |
| **Dev Tools** | VS Code, Postman, Git + GitHub, ESLint, Prettier, dotenv |
| **Deployment** | Frontend → Vercel / Netlify · Backend → Render.com · DB → MongoDB Atlas |

---

## 🔗 REST API Endpoints

```
POST   /api/students/profile
PUT    /api/students/resume
GET    /api/jobs                          # eligible drives
POST   /api/jobs/:id/apply
POST   /api/company/jobs                  # create job
GET    /api/company/applications/:jobId
POST   /api/placement/shortlist/upload
PUT    /api/applications/:id/status
GET    /api/analytics/placement-stats
GET    /api/notifications/:userId
POST   /api/admin/companies/approve
```

---

## 🗄️ Database Schema (MongoDB Collections)

| Collection | Key Fields |
|---|---|
| **Students** | name, email, branch, year, cgpa, skills[], resumeUrl, projects[] |
| **Companies** | name, recruiterEmail, industry, approved, jobPostings[] |
| **Jobs** | title, companyId, description, package, eligibility, deadline, status |
| **Applications** | studentId, jobId, status, rounds[{name, result, scheduledAt}] |
| **Shortlists** | jobId, roundName, studentIds[], uploadedAt |
| **Notifications** | userId, message, type, read, createdAt |

---

## 🔒 Non-Functional Requirements

- **Security** — JWT stateless auth, bcrypt password hashing, HTTPS only, input validation with Joi/Zod, API rate limiting
- **Performance** — API response time < 500ms for 95% of requests, database indexes on frequently queried fields, lazy loading on frontend
- **Scalability** — Stateless backend deployable across multiple instances, MongoDB Atlas for managed scaling
- **Responsiveness** — Mobile-first UI with Tailwind CSS, tested on Chrome/Firefox/Safari, 320px–1920px viewport support
- **Accessibility** — WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, proper ARIA labels
- **Code Quality** — ESLint + Prettier configured, GitHub branching strategy (main/dev/feature), PR-based code reviews
- **Documentation** — API documented via Postman Collection + README, inline code comments, ER diagram, architecture diagram
- **Testing** — Unit tests for critical APIs using Jest, manual E2E testing checklist, automated Postman collection

---

## 👥 Team — Group 3

| Role | Members |
|---|---|
| Frontend Development | 2 Members |
| Backend Development | 2 Members |

---

## 📊 Evaluation Criteria

| Criteria | Weightage |
|---|---|
| Functionality | 30% |
| Code Quality | 20% |
| UI/UX Design | 15% |
| API Design | 15% |
| Database Design | 10% |
| Presentation | 10% |

---

## 📄 License

This is an academic internship project developed for Geeta University's MERN Stack Internship Program.
**Confidential — For Internal Academic Use Only.**