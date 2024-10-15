const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkspaceSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    boards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    owner: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Workspace", WorkspaceSchema);
