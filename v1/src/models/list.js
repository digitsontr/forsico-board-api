const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ListSchema = new Schema(
  {
    id: String,
    name: String,
    color: { type: String, default: "#f2f2f2" },
    boardId: { type: String, required: true },
    workspaceId: { type: String, required: true },
    tasks: [{ type: String, ref: "Task" }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
    order: { type: Number, unique: true },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("List", ListSchema);
