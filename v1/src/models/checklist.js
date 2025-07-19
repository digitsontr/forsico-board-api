const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChecklistItemSchema = new Schema(
  {
    title: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const ChecklistSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    items: [ChecklistItemSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Checklist", ChecklistSchema);
