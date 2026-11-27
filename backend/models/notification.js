const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true, // e.g. "application_status", "job_post", "interview_scheduled", "general"
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Push every new notification to the user live (bell, notifications page). Status
// updates also tell the applications page to refresh.
const pushLive = (doc) => {
  const { emitToUser } = require("../utils/realtime");
  const payload = { _id: doc._id, message: doc.message, type: doc.type, read: doc.read, createdAt: doc.createdAt };
  emitToUser(doc.userId, "notification", payload);
  if (["application_status", "interview_scheduled", "offer"].includes(doc.type)) {
    emitToUser(doc.userId, "application_status_update", payload);
  }
};
notificationSchema.pre("save", function () {
  this.$locals.wasNew = this.isNew;
});
notificationSchema.post("save", function (doc) {
  if (doc.$locals?.wasNew) pushLive(doc);
});
notificationSchema.post("insertMany", function (docs) {
  (docs || []).forEach(pushLive);
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
