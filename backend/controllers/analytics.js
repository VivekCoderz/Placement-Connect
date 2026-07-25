const Student = require("../models/student");
const Application = require("../models/application");
const Job = require("../models/job");
const Company = require("../models/company");
const ErrorWrapper = require("../utils/ErrorWrapper");

// Get Placement stats
module.exports.getPlacementStats = ErrorWrapper(async (req, res, next) => {
  // 1. Branch-wise placement rates
  const branchStats = await Student.aggregate([
    {
      $group: {
        _id: "$branch",
        totalStudents: { $sum: 1 },
        placedStudents: {
          $sum: { $cond: [{ $eq: ["$isPlaced", true] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        branch: "$_id",
        totalStudents: 1,
        placedStudents: 1,
        placementRate: {
          $multiply: [
            {
              $cond: [
                { $eq: ["$totalStudents", 0] },
                0,
                { $divide: ["$placedStudents", "$totalStudents"] },
              ],
            },
            100,
          ],
        },
        _id: 0,
      },
    },
  ]);

  // 2. Company-wise selections
  const companyStats = await Application.aggregate([
    { $match: { status: "Selected" } },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "companies",
        localField: "job.companyId",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: "$company" },
    {
      $group: {
        _id: "$company.name",
        selections: { $sum: 1 },
      },
    },
    {
      $project: {
        companyName: "$_id",
        selections: 1,
        _id: 0,
      },
    },
  ]);

  // 3. Package statistics for selected offers
  const packageAgg = await Application.aggregate([
    { $match: { status: "Selected" } },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $group: {
        _id: null,
        maxPackage: { $max: "$job.package" },
        avgPackage: { $avg: "$job.package" },
        minPackage: { $min: "$job.package" },
        totalOffers: { $sum: 1 },
      },
    },
  ]);

  const packageStats = packageAgg.length > 0
    ? packageAgg[0]
    : { maxPackage: 0, avgPackage: 0, minPackage: 0, totalOffers: 0 };

  delete packageStats._id;

  return res.status(200).json({
    branchStats,
    companyStats,
    packageStats,
  });
});

// Get detailed stats for production-level dashboards
module.exports.getDetailedStats = ErrorWrapper(async (req, res, next) => {
  // Fetch all necessary data
  const students = await Student.find().lean();
  const companies = await Company.find().lean();
  const jobs = await Job.find().lean();
  const applications = await Application.find()
    .populate({
      path: "studentId",
      select: "name rollNumber branch skills cgpa"
    })
    .populate({
      path: "jobId",
      select: "title package companyId eligibility"
    })
    .lean();

  // Maps for quick lookup
  const companyMap = {};
  companies.forEach(c => {
    companyMap[c._id.toString()] = c;
  });

  const jobMap = {};
  jobs.forEach(j => {
    jobMap[j._id.toString()] = j;
  });

  // Calculate unique students counts
  const totalStudents = students.length;
  const placedStudents = students.filter(s => s.isPlaced).length;
  const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : "0.0";
  const totalCompanies = companies.length;
  const totalDrives = jobs.length;
  const totalApplications = applications.length;

  // Let's compute company-wise statistics
  // Group applications by company
  const companyStatsMap = {};
  companies.forEach(c => {
    companyStatsMap[c._id.toString()] = {
      companyId: c._id.toString(),
      companyName: c.name,
      industry: c.industry || "Technology",
      totalDrives: 0,
      appliedStudentIds: new Set(),
      placedStudentsList: [],
      packages: []
    };
  });

  // Count drives per company
  jobs.forEach(j => {
    const compIdStr = j.companyId?.toString();
    if (compIdStr && companyStatsMap[compIdStr]) {
      companyStatsMap[compIdStr].totalDrives++;
    }
  });

  // Process applications for company statistics
  applications.forEach(app => {
    const job = app.jobId;
    if (!job) return;
    const compIdStr = job.companyId?.toString();
    if (!compIdStr || !companyStatsMap[compIdStr]) return;

    const stats = companyStatsMap[compIdStr];
    if (app.studentId) {
      stats.appliedStudentIds.add(app.studentId._id.toString());
    }

    if (app.status === "Selected" && app.studentId) {
      stats.placedStudentsList.push({
        studentId: app.studentId._id.toString(),
        studentName: app.studentId.name,
        rollNumber: app.studentId.rollNumber,
        branch: app.studentId.branch,
        jobTitle: job.title,
        package: job.package
      });
      if (typeof job.package === "number") {
        stats.packages.push(job.package);
      }
    }
  });

  // Format company stats
  const companyStats = Object.values(companyStatsMap).map(stats => {
    const uniqueApplied = stats.appliedStudentIds.size;
    const uniquePlaced = stats.placedStudentsList.length;
    const pkgs = stats.packages;
    const highestPackage = pkgs.length > 0 ? Math.max(...pkgs) : 0;
    const lowestPackage = pkgs.length > 0 ? Math.min(...pkgs) : 0;
    const averagePackage = pkgs.length > 0 ? parseFloat((pkgs.reduce((s, p) => s + p, 0) / pkgs.length).toFixed(1)) : 0;

    return {
      companyId: stats.companyId,
      companyName: stats.companyName,
      industry: stats.industry,
      totalDrives: stats.totalDrives,
      uniqueAppliedStudents: uniqueApplied,
      uniquePlacedStudents: uniquePlaced,
      highestPackage,
      lowestPackage,
      averagePackage,
      placedStudentsList: stats.placedStudentsList
    };
  });

  // Let's compute drive-wise statistics
  const driveStats = jobs.map(job => {
    const company = companyMap[job.companyId?.toString()];
    const companyName = company ? company.name : "Unknown Company";

    const jobApps = applications.filter(app => app.jobId && app.jobId._id.toString() === job._id.toString());
    const uniqueApplied = new Set(jobApps.map(app => app.studentId?._id?.toString()).filter(Boolean)).size;
    const uniqueShortlisted = new Set(jobApps.filter(app => app.status === "Shortlisted").map(app => app.studentId?._id?.toString()).filter(Boolean)).size;
    const uniqueSelected = new Set(jobApps.filter(app => app.status === "Selected").map(app => app.studentId?._id?.toString()).filter(Boolean)).size;
    const uniqueRejected = new Set(jobApps.filter(app => app.status === "Rejected").map(app => app.studentId?._id?.toString()).filter(Boolean)).size;

    return {
      jobId: job._id.toString(),
      jobTitle: job.title,
      companyName,
      package: job.package,
      uniqueApplied,
      uniqueShortlisted,
      uniqueSelected,
      uniqueRejected,
      deadline: job.deadline,
      status: job.status
    };
  });

  // Let's compute package statistics & breakdown
  const selectedApps = applications.filter(app => app.status === "Selected" && app.studentId && app.jobId && typeof app.jobId.package === "number");
  const selectedPackages = selectedApps.map(app => app.jobId.package);

  const highestPackageVal = selectedPackages.length > 0 ? Math.max(...selectedPackages) : 0;
  const lowestPackageVal = selectedPackages.length > 0 ? Math.min(...selectedPackages) : 0;
  const averagePackageVal = selectedPackages.length > 0 ? parseFloat((selectedPackages.reduce((s, p) => s + p, 0) / selectedPackages.length).toFixed(1)) : 0;

  // Find students with highest package
  const highestPlacedDetails = selectedApps
    .filter(app => app.jobId.package === highestPackageVal)
    .map(app => {
      const company = companyMap[app.jobId.companyId?.toString()];
      return {
        studentName: app.studentId.name,
        rollNumber: app.studentId.rollNumber,
        branch: app.studentId.branch,
        companyName: company ? company.name : "Unknown",
        jobTitle: app.jobId.title,
        package: app.jobId.package
      };
    });

  // Find students with lowest package
  const lowestPlacedDetails = selectedApps
    .filter(app => app.jobId.package === lowestPackageVal)
    .map(app => {
      const company = companyMap[app.jobId.companyId?.toString()];
      return {
        studentName: app.studentId.name,
        rollNumber: app.studentId.rollNumber,
        branch: app.studentId.branch,
        companyName: company ? company.name : "Unknown",
        jobTitle: app.jobId.title,
        package: app.jobId.package
      };
    });

  // Count placed in ranges
  const rangeCounts = [
    { range: "Below 5 LPA", count: 0 },
    { range: "5 - 10 LPA", count: 0 },
    { range: "10 - 15 LPA", count: 0 },
    { range: "15 - 25 LPA", count: 0 },
    { range: "Above 25 LPA", count: 0 }
  ];

  selectedPackages.forEach(pkg => {
    if (pkg < 5) rangeCounts[0].count++;
    else if (pkg >= 5 && pkg < 10) rangeCounts[1].count++;
    else if (pkg >= 10 && pkg < 15) rangeCounts[2].count++;
    else if (pkg >= 15 && pkg <= 25) rangeCounts[3].count++;
    else if (pkg > 25) rangeCounts[4].count++;
  });

  const packageBreakdown = {
    highestValue: highestPackageVal,
    highestPlaced: highestPlacedDetails,
    lowestValue: lowestPackageVal,
    lowestPlaced: lowestPlacedDetails,
    averageValue: averagePackageVal,
    ranges: rangeCounts
  };

  // Skill-wise package analytics
  const skillStatsMap = {};
  selectedApps.forEach(app => {
    const student = app.studentId;
    const pkg = app.jobId.package;
    if (student.skills && Array.isArray(student.skills)) {
      student.skills.forEach(skillRaw => {
        const skill = skillRaw.trim();
        if (!skill) return;

        // case-insensitive normalization for better grouping, but keep display title nice
        const skillKey = skill.toLowerCase();
        if (!skillStatsMap[skillKey]) {
          skillStatsMap[skillKey] = {
            skillName: skill, // store original casing for UI display
            placedCount: 0,
            packages: []
          };
        }
        
        skillStatsMap[skillKey].placedCount++;
        skillStatsMap[skillKey].packages.push(pkg);
      });
    }
  });

  const skillStats = Object.values(skillStatsMap).map(s => {
    const highest = Math.max(...s.packages);
    const lowest = Math.min(...s.packages);
    const average = parseFloat((s.packages.reduce((sum, p) => sum + p, 0) / s.packages.length).toFixed(1));

    return {
      skill: s.skillName,
      placedCount: s.placedCount,
      highestPackage: highest,
      lowestPackage: lowest,
      averagePackage: average
    };
  }).sort((a, b) => b.highestPackage - a.highestPackage); // Sort by highest package first

  // Branch statistics
  const branchMap = {};
  students.forEach(s => {
    const b = s.branch || "Unknown";
    if (!branchMap[b]) {
      branchMap[b] = {
        branch: b,
        totalStudents: 0,
        placedStudents: 0,
        packages: []
      };
    }
    branchMap[b].totalStudents++;
    if (s.isPlaced) {
      branchMap[b].placedStudents++;
    }
  });

  // Include package details for branch from Selected applications
  selectedApps.forEach(app => {
    const b = app.studentId.branch || "Unknown";
    if (branchMap[b]) {
      branchMap[b].packages.push(app.jobId.package);
    }
  });

  const branchStats = Object.values(branchMap).map(b => {
    const pkgs = b.packages;
    const highest = pkgs.length > 0 ? Math.max(...pkgs) : 0;
    const lowest = pkgs.length > 0 ? Math.min(...pkgs) : 0;
    const average = pkgs.length > 0 ? parseFloat((pkgs.reduce((sum, p) => sum + p, 0) / pkgs.length).toFixed(1)) : 0;
    const rate = b.totalStudents > 0 ? parseFloat(((b.placedStudents / b.totalStudents) * 100).toFixed(1)) : 0;

    return {
      branch: b.branch,
      totalStudents: b.totalStudents,
      placedStudents: b.placedStudents,
      placementRate: rate,
      highestPackage: highest,
      lowestPackage: lowest,
      averagePackage: average
    };
  });

  // Return the detailed data
  return res.status(200).json({
    overview: {
      totalStudents,
      placedStudents,
      placementRate,
      totalCompanies,
      totalDrives,
      totalApplications,
      highestPackage: highestPackageVal,
      lowestPackage: lowestPackageVal,
      averagePackage: averagePackageVal
    },
    companyStats,
    driveStats,
    packageBreakdown,
    skillStats,
    branchStats
  });
});

