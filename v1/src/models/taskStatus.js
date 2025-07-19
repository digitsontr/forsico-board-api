const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TaskStatusSchema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#f2f2f2" },
    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
    allowedTransitions: [{ type: Schema.Types.ObjectId, ref: "TaskStatus" }], 
    listId: { type: Schema.Types.ObjectId, ref: "List" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("TaskStatus", TaskStatusSchema);
