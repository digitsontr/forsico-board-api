const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//TODO Add checklists and taskfeature
const TaskSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    board_id: { type: String, ref: "Board" },
    media: [String],
    assignee: { type: String, ref: "User" },
    due_date: Date,
    owner_id: { type: String, ref: "User" },
    priority: Number,
    entrance_date: Date,
    list_id: { type: String, ref: "Board" },
    parent_task: { type: String, ref: "Task" },
    subtasks: [{ type: String, ref: "Task" }],
    workspaceId: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
