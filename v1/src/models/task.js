const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TaskSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    boardId: { type: String, ref: "Board" },
    media: [String],
    assignee: { type: String, ref: "User" },
    dueDate: Date,
    ownerId: { type: String, ref: "User" },
    priority: Number,
    entranceDate: Date,
    listId: { type: String, ref: "List" },
    parentTask: { type: String, ref: "Task" },
    subtasks: [{ type: String, ref: "Task" }],
    workspaceId: { type: String, required: true },
    statusId: { type: Schema.Types.ObjectId, ref: "TaskStatus" },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    checklists: [{ type: Schema.Types.ObjectId, ref: "Checklist" }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { versionKey: false, timestamps: true }
);

TaskSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Task", TaskSchema);
