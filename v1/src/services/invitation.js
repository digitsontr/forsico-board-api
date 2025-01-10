const Invitation = require("../models/invitation");
const User = require("../models/user");
const Workspace = require("../models/workspace");
const Board = require("../models/board");
const emailService = require("./email");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const createInvitations = async (
  inviterId,
  inviteeEmails,
  boardId,
  accessToken
) => {
  const board = await Board.findById(boardId);
  if (!board) return ApiResponse.fail([new ErrorDetail("Board not found")]);

  const user = await User.findOne(
    { id: inviterId },
    "_id id firstName lastName profilePicture"
  );

  const results = {
    success: [],
    failed: [],
  };

  for (const email of inviteeEmails) {
    try {
      const existingInvitation = await Invitation.findOne({
        inviteeEmail: email,
        boardId,
        status: "pending",
      });
      if (existingInvitation) {
        results.failed.push({
          email,
          error: "Pending invitation already exists",
        });
        continue;
      }

      const invitation = new Invitation({
        inviterId: user._id,
        inviteeEmail: email,
        boardId,
        workspaceId: board.workspaceId,
        status: "pending",
      });

      await emailService.sendEmail({
        to: email,
        subject: "You've invited to the new board!",
        htmlPath: "./v1/src/assets/inviteBoardMailTemplate.html",
        accessToken: accessToken,
      });

      await invitation.save();
      results.success.push(invitation);
    } catch (error) {
      results.failed.push({ email, error: error.message });
    }
  }

  return ApiResponse.success(results);
};

const acceptInvitation = async (invitationId, user) => {
  let existingUser = await User.findOne({ id: user.sub });

  let userToSave;
  if (!existingUser) {
    userToSave = new User({
      id: user.sub,
      firstName: user.name,
      lastName: user.family_name,
      profilePicture: user.picture,
    });
  } else {
    userToSave = existingUser;
  }

  await userToSave.save();

  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.status !== "pending")
    return ApiResponse.fail([new ErrorDetail("Invalid invitation")]);

  const board = await Board.findById(invitation.boardId);
  const workspace = await Workspace.findById(invitation.workspaceId);

  if (!workspace.members.includes(userToSave._id))
    workspace.members.push(userToSave._id);
  if (!board.members.includes(userToSave._id))
    board.members.push(userToSave._id);

  invitation.status = "accepted";
  await invitation.save();
  await Promise.all([board.save(), workspace.save()]);

  return ApiResponse.success({ message: "Invitation accepted" });
};

const declineInvitation = async (invitationId) => {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.status !== "pending")
    return ApiResponse.fail([new ErrorDetail("Invalid invitation")]);

  invitation.status = "declined";
  await invitation.save();
  return ApiResponse.success({ message: "Invitation declined" });
};

const getInvitationsForUser = async (email) => {
  try {
    // Get invitations received by the user
    const receivedInvitations = await Invitation.find({
      inviteeEmail: email,
      status: "pending"
    })
      .populate("inviterId", "firstName lastName email")
      .populate("boardId", "name")
      .populate("workspaceId", "name");

    // Get invitations sent by the user
    const user = await User.findOne({ email });
    const sentInvitations = await Invitation.find({
      inviterId: user?._id,
      status: "pending"
    })
      .populate("inviterId", "firstName lastName email")
      .populate("boardId", "name")
      .populate("workspaceId", "name");

    return ApiResponse.success({
      received: receivedInvitations,
      sent: sentInvitations
    });

  } catch (e) {
    console.error("Error fetching invitations:", e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to retrieve invitations")
    ]);
  }
};

module.exports = {
  createInvitations,
  acceptInvitation,
  declineInvitation,
  getInvitationsForUser,
};
