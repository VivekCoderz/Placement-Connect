// Single source of truth for "can this student apply to this job?". Used by the job
// list, the job detail page and the apply endpoint so they can never disagree.

const BRANCH_GROUPS = [
  ["CSE", "CS", "COMPUTER SCIENCE", "COMPUTER SCIENCE & ENGINEERING", "COMPUTER ENGINEERING"],
  ["IT", "INFORMATION TECHNOLOGY"],
  ["ECE", "ELECTRONICS", "ELECTRONICS & COMMUNICATION"],
  ["EEE", "ELECTRICAL", "ELECTRICAL & ELECTRONICS"],
  ["MECH", "MECHANICAL", "MECHANICAL ENGINEERING"],
  ["CIVIL", "CIVIL ENGINEERING"],
];

const normalize = (value) => String(value || "").trim().toUpperCase();

const isBranchEligible = (studentBranch, jobBranches = []) => {
  const branch = normalize(studentBranch);
  const eligible = jobBranches.map(normalize).filter(Boolean);
  if (eligible.length === 0 || eligible.includes("ALL") || eligible.includes("ANY")) return true;
  if (eligible.includes(branch)) return true;
  return BRANCH_GROUPS.some(
    (group) =>
      group.some((alias) => alias === branch || branch.includes(alias)) &&
      group.some((alias) => eligible.some((eb) => eb === alias || eb.includes(alias))),
  );
};

// Graduation year of a student in academic year `year` (1-4) of a 4-year programme.
// The academic year starts in July.
const expectedGraduationYear = (year, now = new Date()) => {
  const academicYearEnd = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return academicYearEnd + (4 - year);
};

// Jobs list either academic years (1-6) or graduation years (e.g. 2027). Final-year
// students also match the previous batch year, since drives for the outgoing batch are
// often announced with the calendar year in which the season started.
const isYearEligible = (studentYear, jobYears = [], now = new Date()) => {
  const years = jobYears.map((y) => parseInt(y, 10)).filter((y) => !Number.isNaN(y));
  if (years.length === 0) return true;
  const year = parseInt(studentYear, 10);
  if (years.includes(year)) return true;
  const grad = expectedGraduationYear(year, now);
  return years.includes(grad) || (year >= 4 && years.includes(grad - 1));
};

/**
 * Returns { eligible, reasons[] } for a student and job. `reasons` are short,
 * student-readable explanations of everything that blocks applying.
 */
const checkEligibility = (student, job, { now = new Date() } = {}) => {
  const reasons = [];

  if (job.status !== "active") reasons.push("This drive is closed.");
  if (job.deadline && new Date(job.deadline) < now) reasons.push("The application deadline has passed.");
  if (student.isPlaced) reasons.push("You have already accepted a placement offer.");

  const minCgpa = Number(job.eligibility?.cgpa) || 0;
  const cgpa = Number(student.cgpa) || 0;
  if (cgpa < minCgpa) reasons.push(`Minimum CGPA is ${minCgpa} (yours is ${cgpa}).`);

  const branches = job.eligibility?.branches || [];
  if (!isBranchEligible(student.branch, branches)) {
    reasons.push(`Open only to: ${branches.join(", ")}.`);
  }

  const years = job.eligibility?.years || [];
  if (!isYearEligible(student.year, years, now)) {
    reasons.push(`Open only to batches: ${years.join(", ")}.`);
  }

  return { eligible: reasons.length === 0, reasons };
};

module.exports = { checkEligibility, isBranchEligible, isYearEligible, expectedGraduationYear };
