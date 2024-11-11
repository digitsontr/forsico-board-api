const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inviteeEmail: { type: String, required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Invitation", invitationSchema);