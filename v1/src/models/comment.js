const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    files: [{ type: String }],
    task_id: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
