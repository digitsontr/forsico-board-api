const Invitation = require("../models/invitation");
const User = require("../models/user");
const { Workspace } = require("../models/workspace");
const Board = require("../models/board");
const emailService = require("./email");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const createInvitations = async (
	inviterId,
	inviteeEmails,
	workspaceIds,
	accessToken
) => {
	const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
	if (!workspaces.length) {
		return ApiResponse.fail([new ErrorDetail("No valid workspaces found")]);
	}

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
				workspaces: { $in: workspaceIds },
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
				workspaces: workspaceIds,
				status: "pending",
			});

			await emailService.sendEmail({
				to: email,
				subject: "You've been invited to workspaces!",
				htmlPath: "./v1/src/assets/inviteWorkspaceMailTemplate.html",
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
	try {
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
		if (!invitation || invitation.status !== "pending") {
			return ApiResponse.fail([new ErrorDetail("Invalid invitation")]);
		}

		// Tüm workspaceleri bul ve kullanıcıyı ekle
		const workspaces = await Workspace.find({
			_id: { $in: invitation.workspaces }
		});

		if (!workspaces || workspaces.length === 0) {
			return ApiResponse.fail([new ErrorDetail("No valid workspaces found")]);
		}

		// Her workspace için üye ekleme işlemi
		const workspaceUpdates = workspaces.map(workspace => {
			if (!workspace.members.includes(userToSave._id)) {
				workspace.members.push(userToSave._id);
				return workspace.save();
			}
			return Promise.resolve();
		});

		// Invitation'ı güncelle
		invitation.status = "accepted";

		// Tüm işlemleri paralel yap
		await Promise.all([
			...workspaceUpdates,
			invitation.save()
		]);

		return ApiResponse.success({ 
			message: "Invitation accepted",
			workspaceCount: workspaces.length
		});
	} catch (error) {
		return ApiResponse.fail([new ErrorDetail("Failed to accept invitation")]);
	}
};

const declineInvitation = async (invitationId) => {
	const invitation = await Invitation.findById(invitationId);
	if (!invitation || invitation.status !== "pending")
		return ApiResponse.fail([new ErrorDetail("Invalid invitation")]);

	invitation.status = "declined";
	await invitation.save();
	return ApiResponse.success({ message: "Invitation declined" });
};

const getInvitationsForUser = async (email, id) => {
	try {
		// Get invitations received by the user
		const receivedInvitations = await Invitation.find({
			inviteeEmail: email,
			status: "pending",
		}).populate("inviterId", "firstName lastName email");

		return ApiResponse.success(receivedInvitations);
	} catch (e) {
		console.error("Error fetching invitations:", e);
		return ApiResponse.fail([
			new ErrorDetail("Failed to retrieve invitations"),
		]);
	}
};

module.exports = {
	createInvitations,
	acceptInvitation,
	declineInvitation,
	getInvitationsForUser,
};
