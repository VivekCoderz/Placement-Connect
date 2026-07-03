const Student = require("../models/student");
const Application = require("../models/application");
const Job = require("../models/job");
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
