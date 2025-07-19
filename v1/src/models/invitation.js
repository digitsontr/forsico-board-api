const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inviteeEmail: { type: String, required: true },
    subscriptionId: { type: String, required: true },
    workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
    role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
    status: { type: String, enum: ["pending", "accepted", "declined", "revoked"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

invitationSchema.index({ inviteeEmail: 1, subscriptionId: 1 }, { unique: true });

module.exports = mongoose.model("Invitation", invitationSchema);