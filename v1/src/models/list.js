const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ListSchema = new Schema(
  {
    id: String,
    name: String,
    boardId: { type: String, required: true },
    workspaceId: { type: String, required: true },
    tasks: [{ type: String, ref: "Task" }],
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("List", ListSchema);
