const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    recruiterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    offerLetterTemplate: {
      type: String,
      default: `<h2>OFFER LETTER</h2>
<p>Date: {{DATE}}</p>
<p>To,<br><strong>{{STUDENT_NAME}}</strong><br>Roll No: {{ROLL_NUMBER}}<br>Branch: {{BRANCH}}</p>
<p>Dear {{STUDENT_NAME}},</p>
<p>We are pleased to offer you the position of <strong>{{JOB_TITLE}}</strong> at <strong>{{COMPANY_NAME}}</strong>. Your annual compensation (CTC) will be <strong>{{CTC}} LPA</strong>.</p>
<p>Please review and confirm your acceptance of this offer letter.</p>
<p>Sincerely,<br><strong>{{COMPANY_NAME}}</strong></p>`
    },
    jobPostings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);
