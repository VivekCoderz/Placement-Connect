const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  
  if (apiKey) {
    try {
      return await analyzeWithGemini(student, job, apiKey);
    } catch (err) {
      console.error("Gemini API resume analysis failed, falling back to rules engine:", err);
      return analyzeWithRules(student, job);
    }
  } else {
    console.log("No GEMINI_API_KEY found in environment. Using high-fidelity Rules Engine fallback.");
    return analyzeWithRules(student, job);
  }
}

/**
 * Call Gemini Generative AI to screen the candidate profile against the JD
 */
async function analyzeWithGemini(student, job, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash which is standard and fast
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
    You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
    Analyze the following Student profile against the Job Description.

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
    Skills: ${JSON.stringify(student.skills || [])}
    Projects: ${JSON.stringify(
      (student.projects || []).map(p => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack
      }))
    )}
    Certifications: ${JSON.stringify((student.certifications || []).map(c => c.title))}

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
      "status": "Shortlisted" or "Rejected" (determine based on: atsScore >= ATS Score Threshold and CGPA eligibility)
    }
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsedData = JSON.parse(responseText);
  
  // Safety checks on parsed data
  parsedData.atsScore = Number(parsedData.atsScore) || 50;
  parsedData.matchPercentage = Number(parsedData.matchPercentage) || parsedData.atsScore;
  parsedData.status = parsedData.atsScore >= (job.atsThreshold || 60) ? "Shortlisted" : "Rejected";

  return parsedData;
}

/**
 * Standard rule-based keyword matching algorithm as a fallback
 */
function analyzeWithRules(student, job) {
  const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
  const prefSkills = (job.preferredSkills || []).map(s => s.toLowerCase());
  const studentSkills = (student.skills || []).map(s => s.toLowerCase());
  
  // Projects tech stack serialization
  const projectTech = [];
  if (student.projects && student.projects.length > 0) {
    student.projects.forEach(p => {
      if (p.techStack) {
        p.techStack.forEach(t => projectTech.push(t.toLowerCase()));
      }
    });
  }

  const allStudentSkills = Array.from(new Set([...studentSkills, ...projectTech]));

  // Calculate skill matches
  const skillsMatch = [];
  const missingSkills = [];
  
  reqSkills.forEach(req => {
    // Exact or partial match
    const found = allStudentSkills.some(s => s.includes(req) || req.includes(s));
    if (found) {
      // Find the display name of the matched skill
      const displaySkill = student.skills.find(s => s.toLowerCase() === req) || req;
      skillsMatch.push(displaySkill);
    } else {
      missingSkills.push(req);
    }
  });

  const matchedPref = [];
  prefSkills.forEach(pref => {
    const found = allStudentSkills.some(s => s.includes(pref) || pref.includes(s));
    if (found) {
      const displaySkill = student.skills.find(s => s.toLowerCase() === pref) || pref;
      matchedPref.push(displaySkill);
    }
  });

  // Score calculation
  let skillPoints = 0;
  if (reqSkills.length > 0) {
    skillPoints += (skillsMatch.length / reqSkills.length) * 50;
  } else {
    skillPoints += 30; // base points
  }

  if (prefSkills.length > 0) {
    skillPoints += (matchedPref.length / prefSkills.length) * 15;
  }

  // CGPA match
  let cgpaPoints = 0;
  const minCgpa = job.eligibility?.cgpa || 0;
  if (student.cgpa >= minCgpa) {
    cgpaPoints = 20;
  } else {
    cgpaPoints = Math.max(0, (student.cgpa / minCgpa) * 15);
  }

  // Project points
  let projectPoints = Math.min(15, (student.projects?.length || 0) * 5);

  const atsScore = Math.min(100, Math.round(skillPoints + cgpaPoints + projectPoints));
  const threshold = job.atsThreshold || 60;
  
  // Branch eligibility
  const branchEligible = job.eligibility?.branches?.length === 0 || 
                         job.eligibility?.branches?.map(b => b.toLowerCase()).includes(student.branch.toLowerCase());

  // Final status decision
  const isCgpaEligible = student.cgpa >= minCgpa;
  const isShortlisted = atsScore >= threshold && branchEligible && isCgpaEligible;
  const status = isShortlisted ? "Shortlisted" : "Rejected";

  // Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];
  
  if (student.cgpa >= 8.5) strengths.push("Excellent academic CGPA record");
  if (skillsMatch.length > 2) strengths.push("Strong alignment with required skills");
  if (student.projects?.length >= 2) strengths.push("Demonstrated hands-on experience via multiple projects");
  if (student.certifications?.length > 0) strengths.push("Proactive learning shown by professional certifications");
  
  if (strengths.length === 0) strengths.push("Basic academic eligibility met");

  if (missingSkills.length > 0) weaknesses.push(`Missing key required technical stack: ${missingSkills.slice(0, 2).join(", ")}`);
  if (student.cgpa < minCgpa) weaknesses.push("Academic CGPA is below the desired target");
  if (!student.projects || student.projects.length === 0) weaknesses.push("Lack of practical projects on resume");

  if (weaknesses.length === 0) weaknesses.push("No major skill gaps identified");

  // Rejection/Selection Reasons
  let selectionReason = "";
  let rejectionReason = "";
  const recommendedLearning = [];

  missingSkills.forEach(skill => {
    recommendedLearning.push(`Learn ${skill.toUpperCase()} fundamentals and build a basic project`);
  });
  if (recommendedLearning.length < 2) {
    recommendedLearning.push("Build a portfolio project showcasing React & backend integrations");
    recommendedLearning.push("Prepare system design and data structures for coding interview");
  }

  if (isShortlisted) {
    selectionReason = `Candidate exhibits a strong ATS score of ${atsScore}% (threshold: ${threshold}%) and matches key skills like ${skillsMatch.slice(0, 3).join(", ")}. Academic CGPA is ${student.cgpa} which exceeds the required minimum.`;
  } else {
    const reasons = [];
    if (!isCgpaEligible) reasons.push(`CGPA (${student.cgpa}) is below the required ${minCgpa}`);
    if (!branchEligible) reasons.push(`Branch ${student.branch} is not eligible`);
    if (atsScore < threshold) reasons.push(`ATS Score (${atsScore}%) did not meet the screening threshold (${threshold}%)`);
    if (missingSkills.length > 0) reasons.push(`Missing core skills: ${missingSkills.slice(0, 3).join(", ")}`);
    
    rejectionReason = reasons.join("; ");
  }

  const skillsListCombined = [...skillsMatch, ...matchedPref];

  return {
    atsScore,
    matchPercentage: atsScore,
    skillsMatch: skillsListCombined,
    missingSkills,
    experienceMatch: student.projects?.length > 0 
      ? `Student has built ${student.projects.length} project(s) matching experience expectations.`
      : "No commercial experience or major project implementations found.",
    educationMatch: `${student.branch} branch, CGPA ${student.cgpa} (Min required: ${minCgpa}).`,
    aiSummary: `Candidate matches ${skillsMatch.length} out of ${reqSkills.length} required skills. ATS Score is ${atsScore}%.`,
    aiCandidateSummary: isShortlisted 
      ? `Great job! Your resume matches the job description. Prepare for upcoming rounds by focusing on ${skillsMatch.slice(0, 2).join(", ")}.`
      : `To improve your score for this role, try adding projects in ${missingSkills.slice(0, 2).join(", ")}, raise your CGPA if possible, and include certifications.`,
    aiRecruiterSummary: `ATS: ${atsScore}%. Candidate meets CGPA requirements. Match level is ${isShortlisted ? 'HIGH' : 'LOW'}. ${missingSkills.length > 0 ? `Lacks: ${missingSkills.slice(0, 2).join(", ")}` : ''}`,
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
