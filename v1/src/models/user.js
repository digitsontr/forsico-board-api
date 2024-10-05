const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    id: String,
    firstname: String,
    lastname: String,
    profilePicture: String,
    workspaces: [{ type: Schema.Types.ObjectId, ref: "Workspace" }],
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
