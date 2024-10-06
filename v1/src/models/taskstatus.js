const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TaskStatusSchema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#f2f2f2" },
    board_id: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    workspace_id: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
    allowed_transitions: [{ type: Schema.Types.ObjectId, ref: "TaskStatus" }], 
    list_id: { type: Schema.Types.ObjectId, ref: "List" },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("TaskStatus", TaskStatusSchema);
