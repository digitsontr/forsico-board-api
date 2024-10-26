const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    files: [{ type: String }],
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
