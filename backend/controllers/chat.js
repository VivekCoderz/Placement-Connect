const Message = require("../models/message");
const User = require("../models/User");
const Student = require("../models/student");
const Company = require("../models/company");
const ErrorWrapper = require("../utils/ErrorWrapper");

// Get contacts list based on user roles
module.exports.getContacts = ErrorWrapper(async (req, res, next) => {
  const currentRole = req.user.role;
  let contacts = [];

  if (currentRole === "student") {
    // Can chat with recruiters and placement cell staff
    const staff = await User.find({ role: { $in: ["placementCell", "admin"] } }, "name email role");
    const companies = await Company.find().populate("recruiterId", "name email role");
    
    contacts = [
      ...staff.map(u => ({ id: u._id, name: u.name, role: u.role })),
      ...companies.filter(c => c.recruiterId).map(c => ({ 
        id: c.recruiterId._id, 
        name: `${c.recruiterId.name} (${c.name})`, 
        role: "recruiter" 
      }))
    ];
  } else if (currentRole === "recruiter") {
    // Can chat with all students and placement cell staff
    const staff = await User.find({ role: { $in: ["placementCell", "admin"] } }, "name email role");
    const students = await Student.find().populate("userId", "name email");

    contacts = [
      ...staff.map(u => ({ id: u._id, name: u.name, role: u.role })),
      ...students.filter(s => s.userId).map(s => ({ 
        id: s.userId._id, 
        name: `${s.name} (${s.branch})`, 
        role: "student" 
      }))
    ];
  } else {
    // Admin & Placement Cell can chat with everyone (Students and Recruiters)
    const students = await Student.find().populate("userId", "name email");
    const recruiters = await Company.find().populate("recruiterId", "name email");

    contacts = [
      ...students.filter(s => s.userId).map(s => ({ 
        id: s.userId._id, 
        name: `${s.name} (${s.branch})`, 
        role: "student" 
      })),
      ...recruiters.filter(r => r.recruiterId).map(r => ({ 
        id: r.recruiterId._id, 
        name: `${r.recruiterId.name} (${r.name})`, 
        role: "recruiter" 
      }))
    ];
  }

  return res.status(200).json({ contacts });
});

// Load message history
module.exports.getMessages = ErrorWrapper(async (req, res, next) => {
  const { receiverId } = req.params;
  const senderId = req.user.id;

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  }).sort({ createdAt: 1 });

  return res.status(200).json({ messages });
});
