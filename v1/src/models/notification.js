const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
  action: { type: String, required: true },
  model: { type: String, required: true },
  message: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletionId: { type: String, default: null },
});

module.exports = mongoose.model("Notification", NotificationSchema);
