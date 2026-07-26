const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PDFParse } = require("pdf-parse");

/**
 * Helper to download and parse raw text from PDF resume URL
 */
async function extractTextFromPdf(url) {
  if (!url) return "";
  try {
    console.log(`Downloading and parsing PDF resume from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download PDF resume, status: ${response.status}`);
      return "";
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || "";
  } catch (err) {
    console.error("Failed to parse PDF resume:", err);
    return "";
  }
}

/**
 * Helper to parse and extract sections/skills/metadata from raw resume text
 */
function parseResumeText(text) {
  const parsed = {
    skills: [],
    languages: [],
    frameworks: [],
    tools: [],
    projects: [],
    experience: [],
    certifications: [],
    degree: null,
    branch: null,
    cgpa: null,
    keywords: [],
    internships: [],
    achievements: []
  };

  if (!text) return parsed;

  const textLower = text.toLowerCase();

  // Dictionary of known technical skills, grouped by category
  const skillsDict = {
    languages: ["javascript", "typescript", "python", "java", "c++", "c#", "ruby", "golang", "go", "rust", "kotlin", "swift", "php", "sql", "html", "css", "r", "scala", "shell", "bash"],
    frameworks: ["react", "angular", "vue", "next.js", "nextjs", "express", "django", "flask", "spring boot", "springboot", "laravel", "fastapi", "jquery", "bootstrap", "tailwind", "hibernate", "nest.js", "nestjs"],
    tools: ["docker", "kubernetes", "aws", "amazon web services", "azure", "gcp", "google cloud", "git", "github", "jenkins", "gitlab", "ansible", "terraform", "maven", "npm", "yarn", "postman", "jira"],
    databases: ["mongodb", "mysql", "postgresql", "sqlite", "redis", "oracle", "mariadb", "cassandra", "dynamodb"],
    coreCS: ["data structures", "algorithms", "dsa", "system design", "oops", "operating systems", "computer networks", "dbms", "software engineering", "compiler design"],
    eceEmbedded: ["embedded c", "arduino", "raspberry pi", "iot", "internet of things", "vlsi", "verilog", "vhdl", "microcontroller", "matlab"],
    mechCivil: ["solidworks", "autocad", "catia", "ansys", "revit", "staad pro", "fusion 360"]
  };

  const matchedSkillsSet = new Set();
  
  // Custom check for C++ to avoid matching just "C"
  if (/\bc\+\+\b/i.test(text)) {
    matchedSkillsSet.add("C++");
    parsed.languages.push("C++");
  }
  if (/\bc\#\b/i.test(text)) {
    matchedSkillsSet.add("C#");
    parsed.languages.push("C#");
  }
  // Custom check for C to avoid matching inside other words
  if (/\bC\b/.test(text)) {
    matchedSkillsSet.add("C");
    parsed.languages.push("C");
  }

  // Iterate other skills
  for (const [category, list] of Object.entries(skillsDict)) {
    for (const skill of list) {
      if (skill === "c++" || skill === "c#" || skill === "c") continue;
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(text)) {
        const displaySkill = ["dsa", "oop", "aws", "gcp", "sql", "bca", "mca", "it", "cse"].includes(skill.toLowerCase())
          ? skill.toUpperCase()
          : skill.charAt(0).toUpperCase() + skill.slice(1);
        matchedSkillsSet.add(displaySkill);

        if (category === "languages") parsed.languages.push(displaySkill);
        else if (category === "frameworks") parsed.frameworks.push(displaySkill);
        else if (category === "tools") parsed.tools.push(displaySkill);
      }
    }
  }

  parsed.skills = Array.from(matchedSkillsSet);

  // Extract CGPA
  const cgpaRegexes = [
    /cgpa\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
    /([0-9]+(?:\.[0-9]+)?)\s*cgpa/i,
    /([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i,
    /gpa\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
    /pointer\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)/i,
  ];
  for (const regex of cgpaRegexes) {
    const match = text.match(regex);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0 && val <= 10) {
        parsed.cgpa = val;
        break;
      }
    }
  }

  // Extract branch
  if (textLower.includes("computer science") || textLower.includes("cse")) {
    parsed.branch = "Computer Science & Engineering";
  } else if (textLower.includes("information technology") || textLower.includes("it")) {
    parsed.branch = "Information Technology";
  } else if (textLower.includes("electronics") || textLower.includes("ece")) {
    parsed.branch = "Electronics & Communication Engineering";
  } else if (textLower.includes("mechanical") || textLower.includes("me")) {
    parsed.branch = "Mechanical Engineering";
  } else if (textLower.includes("civil") || textLower.includes("ce")) {
    parsed.branch = "Civil Engineering";
  }

  // Extract degree
  if (textLower.includes("b.tech") || textLower.includes("btech") || textLower.includes("bachelor of technology")) {
    parsed.degree = "B.Tech";
  } else if (textLower.includes("m.tech") || textLower.includes("mtech") || textLower.includes("master of technology")) {
    parsed.degree = "M.Tech";
  } else if (textLower.includes("bca") || textLower.includes("bachelor of computer applications")) {
    parsed.degree = "BCA";
  } else if (textLower.includes("mca") || textLower.includes("master of computer applications")) {
    parsed.degree = "MCA";
  } else if (textLower.includes("bsc") || textLower.includes("b.sc") || textLower.includes("bachelor of science")) {
    parsed.degree = "B.Sc";
  } else if (textLower.includes("msc") || textLower.includes("m.sc") || textLower.includes("master of science")) {
    parsed.degree = "M.Sc";
  }

  // Extract sections: Certifications, Projects, Experience, Achievements
  const sections = text.split(/\n\s*\n/);
  sections.forEach(sec => {
    const secLower = sec.toLowerCase();
    
    if (secLower.includes("certif") || secLower.includes("credential") || secLower.includes("licensed")) {
      const lines = sec.split("\n").map(l => l.trim()).filter(l => l.length > 3);
      lines.forEach(l => {
        if (!l.toLowerCase().includes("certif") && l.length < 100) {
          parsed.certifications.push(l.replace(/^[●\-\*\s]+/, ""));
        }
      });
    }

    if (secLower.includes("project") || secLower.includes("academic project")) {
      const lines = sec.split("\n").map(l => l.trim()).filter(l => l.length > 5);
      lines.forEach(l => {
        if (!l.toLowerCase().includes("project") && l.length < 150) {
          parsed.projects.push(l.replace(/^[●\-\*\s]+/, ""));
        }
      });
    }

    if (secLower.includes("experience") || secLower.includes("intern") || secLower.includes("work history")) {
      const lines = sec.split("\n").map(l => l.trim()).filter(l => l.length > 5);
      lines.forEach(l => {
        if (l.toLowerCase().includes("intern") || l.toLowerCase().includes("trainee") || l.toLowerCase().includes("developer")) {
          parsed.internships.push(l.replace(/^[●\-\*\s]+/, ""));
        }
      });
    }

    if (secLower.includes("achievement") || secLower.includes("award") || secLower.includes("honors")) {
      const lines = sec.split("\n").map(l => l.trim()).filter(l => l.length > 5);
      lines.forEach(l => {
        if (!l.toLowerCase().includes("achievement") && l.length < 150) {
          parsed.achievements.push(l.replace(/^[●\-\*\s]+/, ""));
        }
      });
    }
  });

  const keywordsDict = ["team", "collaboration", "agile", "scrum", "development", "analytical", "problem-solving", "scalable", "leadership", "management", "cloud", "security", "testing", "deployment", "design", "communication"];
  keywordsDict.forEach(kw => {
    if (textLower.includes(kw)) {
      parsed.keywords.push(kw);
    }
  });

  return parsed;
}

/**
 * Perform AI Resume screening by comparing student profile with Job description.
 * Utilizes Google Gemini API if GEMINI_API_KEY is defined in .env,
 * otherwise falls back to a high-fidelity local keyword rules matching engine.
 * 
 * @param {Object} student - Student database record
 * @param {Object} job - Job database record
 * @returns {Promise<Object>} Analysis results matching ResumeAnalysis schema
 */
async function analyzeResume(student, job) {
  const apiKey = process.env.GEMINI_API_KEY;
  let resumeText = "";
  
  if (student.resumeUrl) {
    resumeText = await extractTextFromPdf(student.resumeUrl);
  } else {
    console.log("No resume url found on candidate profile. Using structured database fields only.");
  }
  
  if (apiKey) {
    try {
      return await analyzeWithGemini(student, job, resumeText, apiKey);
    } catch (err) {
      console.error("Gemini API resume analysis failed, falling back to rules engine:", err);
      return analyzeWithRules(student, job, resumeText);
    }
  } else {
    console.log("No GEMINI_API_KEY found in environment. Using high-fidelity Rules Engine fallback.");
    return analyzeWithRules(student, job, resumeText);
  }
}

/**
 * Call Gemini Generative AI to screen the candidate profile against the JD
 */
async function analyzeWithGemini(student, job, resumeText, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
    Analyze the following Student profile and their raw Resume Text against the Job Description.
    Ensure you read the raw Resume Text to check for required and preferred skills, matching experience, projects, and certifications.
    Do not reject a candidate if the required skills or experience are present in the Resume Text, even if they are missing in the structured profile.

    === JOB DESCRIPTION ===
    Title: ${job.title}
    Company: ${job.companyName || "the Company"}
    Description: ${job.description}
    Required Skills: ${JSON.stringify(job.requiredSkills || [])}
    Preferred Skills: ${JSON.stringify(job.preferredSkills || [])}
    Minimum CGPA: ${job.eligibility?.cgpa || 0}
    Eligible Branches: ${JSON.stringify(job.eligibility?.branches || [])}
    Required Experience: ${job.experienceRequired || "0 years"}
    ATS Score Threshold: ${job.atsThreshold || 60}

    === STUDENT PROFILE ===
    Name: ${student.name}
    CGPA: ${student.cgpa}
    Branch: ${student.branch}
    Graduation Year: ${student.year}
    Structured Skills: ${JSON.stringify(student.skills || [])}

    === STUDENT RAW RESUME TEXT ===
    ${resumeText || "No raw resume text provided."}

    Provide your response strictly as a JSON object with the following fields:
    {
      "atsScore": (number between 0 and 100),
      "matchPercentage": (number between 0 and 100),
      "skillsMatch": [array of matched skills strings],
      "missingSkills": [array of missing required skills strings],
      "experienceMatch": "Brief explanation of how their experience matches",
      "educationMatch": "Brief explanation of how their branch/CGPA matches requirements",
      "aiSummary": "1-2 sentence overall summary of the candidate's fit",
      "aiCandidateSummary": "Feedback directly addressed to the student explaining how they can improve",
      "aiRecruiterSummary": "Internal recommendation notes for the recruiter",
      "strengths": [array of 2-4 candidate strengths],
      "weaknesses": [array of 1-3 gaps or weaknesses],
      "recommendedLearning": [array of 2-3 specific topics they should learn/courses to take],
      "selectionReason": "Detailed reason why they were shortlisted (empty if rejected)",
      "rejectionReason": "Detailed rejection reason list of bullet points explaining why they failed (empty if shortlisted)",
      "status": "Shortlisted" or "Borderline" or "Rejected" (determine based on: atsScore >= 80 -> "Shortlisted"; atsScore >= ATS Score Threshold -> "Borderline"; atsScore < ATS Score Threshold -> "Rejected"; verify CGPA eligibility)
    }
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsedData = JSON.parse(responseText);
  
  // Safety checks on parsed data
  parsedData.atsScore = Number(parsedData.atsScore) || 50;
  parsedData.matchPercentage = Number(parsedData.matchPercentage) || parsedData.atsScore;

  const threshold = job.atsThreshold || 60;
  if (parsedData.atsScore >= 80) {
    parsedData.status = "Shortlisted";
  } else if (parsedData.atsScore >= threshold) {
    parsedData.status = "Borderline";
  } else {
    parsedData.status = "Rejected";
  }

  // Ensure flat fields are fully populated
  parsedData.matchedKeywords = parsedData.skillsMatch;
  parsedData.missingKeywords = parsedData.missingSkills;

  return parsedData;
}

/**
 * Standard rule-based keyword matching algorithm as a fallback
 */
function analyzeWithRules(student, job, resumeText) {
  const parsedResume = parseResumeText(resumeText);

  // Combine database values and parsed resume values
  const studentSkills = Array.from(new Set([
    ...(student.skills || []).map(s => s.toLowerCase()),
    ...parsedResume.skills.map(s => s.toLowerCase())
  ]));

  const studentProjects = student.projects && student.projects.length > 0
    ? student.projects
    : parsedResume.projects.map(title => ({ title, description: "", techStack: [] }));

  const studentCgpa = student.cgpa || parsedResume.cgpa || 0;
  const studentBranch = student.branch || parsedResume.branch || "";

  // 1. Resolve skills match
  const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  const prefSkills = (job.preferredSkills || []).map(s => s.toLowerCase());
  
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  
  // If requiredSkills array is empty, dynamically extract keywords from JD
  const jdSkills = [];
  const skillsDictFlattened = [
    "react", "angular", "vue", "next.js", "nextjs", "express", "django", "flask", "spring boot", "springboot", "laravel", "fastapi", "html", "css", "bootstrap", "tailwind",
    "node.js", "nodejs", "python", "java", "c++", "c#", "ruby", "golang", "go", "rust", "kotlin", "swift", "php", "sql",
    "mongodb", "mysql", "postgresql", "sqlite", "redis", "oracle", "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "jenkins",
    "data structures", "algorithms", "dsa", "system design", "oops", "operating systems", "computer networks", "dbms",
    "embedded c", "arduino", "raspberry pi", "iot", "vlsi", "verilog", "vhdl", "matlab", "solidworks", "autocad", "catia", "ansys", "revit", "staad pro"
  ];
  skillsDictFlattened.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(jobText)) {
      jdSkills.push(skill);
    }
  });

  const finalReqSkills = reqSkills.length > 0 ? reqSkills : jdSkills.slice(0, 5);

  const skillsMatch = [];
  const missingSkills = [];
  
  finalReqSkills.forEach(req => {
    if (studentSkills.some(s => s.includes(req) || req.includes(s))) {
      skillsMatch.push(req.toUpperCase());
    } else {
      missingSkills.push(req.toUpperCase());
    }
  });

  const matchedPref = [];
  prefSkills.forEach(pref => {
    if (studentSkills.some(s => s.includes(pref) || pref.includes(s))) {
      matchedPref.push(pref.toUpperCase());
    }
  });

  // Calculate Weights
  // A. Skills Match (40 points)
  let skillPoints = 0;
  if (finalReqSkills.length > 0) {
    skillPoints += (skillsMatch.length / finalReqSkills.length) * 30;
  } else {
    skillPoints += 25; // default base points
  }
  if (prefSkills.length > 0) {
    skillPoints += (matchedPref.length / prefSkills.length) * 10;
  } else {
    skillPoints += Math.min(10, skillsMatch.length * 2); // extra credit for matching more required skills
  }

  // B. Keyword Match (15 points)
  const commonKeywords = ["development", "design", "testing", "deployment", "analysis", "agile", "database", "cloud", "system", "scrum", "teamwork", "communication", "leadership"];
  let matchedKeywordsCount = 0;
  commonKeywords.forEach(kw => {
    if (jobText.includes(kw) && (resumeText.toLowerCase().includes(kw) || student.skills?.some(s => s.toLowerCase().includes(kw)))) {
      matchedKeywordsCount++;
    }
  });
  const keywordPoints = Math.min(15, (matchedKeywordsCount / Math.max(1, commonKeywords.filter(k => jobText.includes(k)).length)) * 15);

  // C. Project Relevance (15 points)
  let projectPoints = 0;
  if (studentProjects.length > 0) {
    let relevantCount = 0;
    studentProjects.forEach(proj => {
      const projText = `${proj.title} ${proj.description || ""} ${JSON.stringify(proj.techStack || [])}`.toLowerCase();
      const isRelevant = finalReqSkills.some(req => projText.includes(req)) || jdSkills.some(jd => projText.includes(jd));
      if (isRelevant) relevantCount++;
    });
    projectPoints = relevantCount >= 2 ? 15 : relevantCount === 1 ? 10 : 7;
  }

  // D. Experience Match (10 points)
  let experiencePoints = 3; // base points
  if (parsedResume.internships.length > 0 || jobText.includes("experience") && (resumeText.toLowerCase().includes("intern") || resumeText.toLowerCase().includes("experience"))) {
    experiencePoints = 10;
  }

  // E. Education Match (10 points)
  let educationPoints = 0;
  const eligibleBranches = (job.eligibility?.branches || []).map(b => b.toLowerCase());
  const isBranchEligible = eligibleBranches.length === 0 || eligibleBranches.includes(studentBranch.toLowerCase());
  if (isBranchEligible) {
    educationPoints += 10;
  } else {
    educationPoints += 4;
  }

  // F. CGPA Match (10 points)
  let cgpaPoints = 0;
  const minCgpa = job.eligibility?.cgpa || 0;
  if (studentCgpa >= minCgpa) {
    cgpaPoints = 10;
  } else if (minCgpa > 0) {
    cgpaPoints = Math.max(0, Math.round((studentCgpa / minCgpa) * 8));
  } else {
    cgpaPoints = 10;
  }

  const atsScore = Math.min(100, Math.round(skillPoints + keywordPoints + projectPoints + experiencePoints + educationPoints + cgpaPoints));
  const threshold = job.atsThreshold || 60;

  // Decide status
  let status = "Rejected";
  if (atsScore >= 80) {
    status = "Shortlisted";
  } else if (atsScore >= threshold) {
    status = "Borderline";
  } else {
    status = "Rejected";
  }

  // Safety override: if student fails basic CGPA eligibility in db, status is Rejected
  if (student.cgpa < minCgpa) {
    status = "Rejected";
  }

  // Strengths and Weaknesses
  const strengths = [];
  const weaknesses = [];

  if (studentCgpa >= 8.5) strengths.push("Excellent academic CGPA record");
  if (skillsMatch.length >= 2) strengths.push(`Strong matching skills: ${skillsMatch.slice(0, 3).join(", ")}`);
  if (studentProjects.length >= 1) strengths.push("Hands-on experience demonstrated via projects");
  if (strengths.length === 0) strengths.push("Meets base qualification guidelines");

  if (missingSkills.length > 0) weaknesses.push(`Missing key technologies: ${missingSkills.slice(0, 2).join(", ")}`);
  if (studentCgpa < minCgpa) weaknesses.push(`CGPA is below the desired target of ${minCgpa}`);
  if (studentProjects.length === 0) weaknesses.push("Lacks major project implementations");
  if (weaknesses.length === 0) weaknesses.push("No major skill gaps identified");

  // Selection / Rejection Reasons
  let selectionReason = "";
  let rejectionReason = "";
  const recommendedLearning = [];

  missingSkills.forEach(skill => {
    recommendedLearning.push(`Learn ${skill} fundamentals and build a mini-project`);
  });
  if (recommendedLearning.length < 2) {
    recommendedLearning.push("Build a portfolio project showcasing React & backend integrations");
    recommendedLearning.push("Prepare system design and data structures for coding interview");
  }

  if (status === "Shortlisted") {
    selectionReason = `Candidate exhibits a strong ATS score of ${atsScore}% (threshold: ${threshold}%) and matches key skills like ${skillsMatch.slice(0, 3).join(", ")}. Academic CGPA is ${studentCgpa} which exceeds the required minimum.`;
  } else if (status === "Borderline") {
    selectionReason = `Candidate is in the borderline zone with an ATS score of ${atsScore}% (threshold: ${threshold}%). Shows decent matching in ${skillsMatch.slice(0, 2).join(", ")}, pending recruiter final manual review.`;
  } else {
    const reasons = [];
    if (studentCgpa < minCgpa) reasons.push(`CGPA (${studentCgpa}) is below the required ${minCgpa}`);
    if (!isBranchEligible) reasons.push(`Branch ${studentBranch} is not eligible`);
    if (atsScore < threshold) reasons.push(`ATS Score (${atsScore}%) did not meet the screening threshold (${threshold}%)`);
    if (missingSkills.length > 0) reasons.push(`Missing core skills: ${missingSkills.slice(0, 3).join(", ")}`);
    
    rejectionReason = reasons.join("; ");
  }

  const skillsListCombined = Array.from(new Set([...skillsMatch, ...matchedPref]));
  const matchedKeywords = skillsMatch; // Map skills as matched keywords
  const missingKeywords = missingSkills;

  return {
    atsScore,
    matchPercentage: atsScore,
    skillsMatch: skillsListCombined,
    missingSkills,
    matchedKeywords,
    missingKeywords,
    experienceMatch: studentProjects.length > 0 
      ? `Student has built ${studentProjects.length} project(s) matching experience expectations.`
      : "No major project implementations or commercial experience found.",
    educationMatch: `${studentBranch} branch, CGPA ${studentCgpa} (Min required: ${minCgpa}).`,
    aiSummary: `Candidate matches ${skillsMatch.length} out of ${finalReqSkills.length} required skills. ATS Score is ${atsScore}%.`,
    aiCandidateSummary: status === "Shortlisted"
      ? `Great job! Your resume matches the job description. Prepare for upcoming rounds by focusing on ${skillsMatch.slice(0, 2).join(", ")}.`
      : status === "Borderline"
      ? `Your profile is borderline. Improve your chances by learning: ${missingSkills.slice(0, 2).join(", ")} and updating your projects.`
      : `To improve your score for this role, try adding projects in ${missingSkills.slice(0, 2).join(", ")}, raise your CGPA if possible, and include certifications.`,
    aiRecruiterSummary: `ATS: ${atsScore}%. Candidate meets CGPA requirements. Match level is ${status}. ${missingSkills.length > 0 ? `Lacks: ${missingSkills.slice(0, 2).join(", ")}` : ''}`,
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 2),
    recommendedLearning: recommendedLearning.slice(0, 3),
    selectionReason,
    rejectionReason,
    status
  };
}

module.exports = {
  analyzeResume
};
