const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BoardSchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    creator: String,
    workspaceId: { type: String, required: true },
    lists: [{ type: Schema.Types.ObjectId, ref: "List" }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletionId: { type: String, default: null },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);
