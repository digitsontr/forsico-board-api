const axios = require("axios");
const baseUrl = process.env.SUBSCRIPTION_API_BASE_URL;
const ExceptionLogger = require("../scripts/logger/exception");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { Workspace } = require("../models/workspace");
const Invitation = require("../models/invitation");
const mongoose = require("mongoose");
const User = require("../models/user");
const emailService = require("../services/email");

const checkIsUserSubscriptionValid = async (subscriptionId, accessToken) => {
  try {
	// API'den kontrol
	const response = await axios.get(
	  `https://forsico-subscription-service-hmh5asdyb2dqc8gv.eastus-01.azurewebsites.net/api/user/subscription/${subscriptionId}`,
	  {
		headers: {
		  Token: accessToken,
		},
	  }
	);

    console.log("SUBSTATUS:: ", response.data.subscription_request.status)

	const result = {
	  isValid: response.data.subscription_request.status === "approved",
	  limits: {
		workspaceLimit: response.data.subscription_type.workspace_limit || 1,
		userLimit: response.data.subscription_type.user_limit || 3,
	  },
	};
	
	console.log("RESPONSE::", response);
	console.log("RESULT::", result);

	return result;
  } catch (error) {
	ExceptionLogger.error("Error checking subscription:", error);
	return {
	  isValid: false,
	  error: [error.message],
	  limits: {
		workspaceLimit: 0,
		userLimit: 0,
	  },
	};
  }
};

const getSubscriptionOverview = async (subscriptionId, accessToken) => {
  try {
	const subscriptionInfo = await checkIsUserSubscriptionValid(subscriptionId, accessToken);
	const workspaces = await Workspace.find({
	  subscriptionId,
	  isDeleted: false,
	}).select("name members");
	const uniqueMembers = new Set();
	workspaces.forEach((workspace) => {
	  workspace.members.forEach((member) =>
		uniqueMembers.add(member.toString())
	  );
	});
	console.log("WORKSPACES", workspaces);
	console.log("UNIQUE MEMBERS", uniqueMembers);

	const pendingInvitations = await Invitation.countDocuments({
	  subscriptionId,
	  status: "pending",
	});

	console.log("SUBSCRIPTION INFO", subscriptionInfo);

	return ApiResponse.success({
	  subscription: subscriptionInfo,
	  stats: {
		totalWorkspaces: workspaces.length,
		totalUniqueMembers: uniqueMembers.size,
		pendingInvitations,
		workspaceLimit: subscriptionInfo.limits.workspaceLimit,
		userLimit: subscriptionInfo.limits.userLimit,
	  },
	});
  } catch (error) {
	console.log("ERROR", error);
	return ApiResponse.fail([
	  new ErrorDetail("Failed to get subscription overview"),
	]);
  }
};

const getSubscriptionMembers = async (subscriptionId) => {
  try {
	// Subscription'a ait tüm workspaceleri al
	const workspaces = await Workspace.find({
	  subscriptionId,
	  isDeleted: false,
	})
	  .populate("members", "id firstName lastName profilePicture")
	  .select("members");

	// Unique üyeleri topla
	const membersMap = new Map();
	workspaces.forEach((workspace) => {
	  workspace.members.forEach((member) => {
		membersMap.set(member.id, {
		  id: member.id,
		  firstName: member.firstName,
		  lastName: member.lastName,
		  profilePicture: member.profilePicture,
		  workspaceCount: (membersMap.get(member.id)?.workspaceCount || 0) + 1,
		});
	  });
	});

	// Map'i array'e çevir
	const members = Array.from(membersMap.values());

	return ApiResponse.success({
	  members,
	  totalCount: members.length,
	});
  } catch (error) {
	ExceptionLogger.error("Error getting subscription members:", error);
	return ApiResponse.fail([
	  new ErrorDetail("Failed to get subscription members"),
	]);
  }
};

const removeUserFromSubscription = async (subscriptionId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
	const user = await User.findOne({ id: userId });
	if (!user) {
	  throw new Error("User not found");
	}
	await Workspace.updateMany(
	  { subscriptionId },
	  { $pull: { members: user._id } },
	  { session }
	);

	await session.commitTransaction();
	return ApiResponse.success({ message: "User removed from subscription" });
  } catch (error) {
	await session.abortTransaction();
	return ApiResponse.fail([new ErrorDetail(error.message)]);
  } finally {
	session.endSession();
  }
};

const inviteToSubscription = async (
  subscriptionId,
  inviterId,
  invitationData,
  accessToken
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
	// Subscription limitlerini kontrol et
	const subscriptionInfo = await checkIsUserSubscriptionValid(subscriptionId, accessToken);
	if (!subscriptionInfo.isValid) {
	  throw new Error("Invalid subscription");
	}

	// Mevcut unique kullanıcı sayısını kontrol et
	const uniqueMembers = await getUniqueSubscriptionMembers(subscriptionId);
	const pendingInvites = await Invitation.countDocuments({
	  subscriptionId,
	  status: "pending",
	});

	// Limit kontrolü (mevcut üyeler + bekleyen davetiyeler + yeni davetiyeler)
	if (
	  uniqueMembers.size + pendingInvites + invitationData.emails.length >
	  subscriptionInfo.limits.userLimit
	) {
	  throw new Error(
		`Adding ${invitationData.emails.length} member(s) would exceed the subscription limit`
	  );
	}

	const inviter = await User.findOne({ id: inviterId });
	if (!inviter) {
	  throw new Error("Inviter not found");
	}

	// Her email için davetiye oluştur
	const invitations = invitationData.emails.map((email) => ({
	  inviterId: inviter._id,
	  inviteeEmail: email,
	  subscriptionId,
	  role: invitationData.role || "MEMBER",
	  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün geçerli
	  workspaces: invitationData.workspaces || [],
	}));

	await Invitation.insertMany(invitations, { session });

	for (const email of invitationData.emails) {
	  await emailService.sendEmail({
		to: email,
		subject: "You've been invited to join a subscription",
		htmlPath: "./v1/src/assets/inviteBoardMailTemplate.html",
		data: {
		  inviterName: `${inviter.firstName} ${inviter.lastName}`,
		  subscriptionId,
		  role: invitationData.role || "MEMBER",
		},
		accessToken: accessToken,
	  });
	}

	await session.commitTransaction();
	return ApiResponse.success({ message: "Invitations sent successfully" });
  } catch (error) {
	await session.abortTransaction();
	return ApiResponse.fail([new ErrorDetail(error.message)]);
  } finally {
	session.endSession();
  }
};

const getUniqueSubscriptionMembers = async (subscriptionId) => {
  const workspaces = await Workspace.find({
	subscriptionId,
	isDeleted: false,
  }).select("members");

  const uniqueMembers = new Set();
  workspaces.forEach((workspace) => {
	workspace.members.forEach((member) => uniqueMembers.add(member.toString()));
  });

  return uniqueMembers;
};

const acceptSubscriptionInvitation = async (invitationId, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
	const invitation = await Invitation.findById(invitationId).populate(
	  "workspaces"
	);

	if (!invitation) {
	  throw new Error("Invitation not found");
	}

	if (invitation.status !== "pending") {
	  throw new Error("Invitation is no longer valid");
	}

	if (invitation.expiresAt < new Date()) {
	  throw new Error("Invitation has expired");
	}

	if (invitation.inviteeEmail !== user.email) {
	  throw new Error("This invitation is not for you");
	}

	// Kullanıcıyı belirtilen workspacelere ekle
	if (invitation.workspaces?.length > 0) {
	  await Workspace.updateMany(
		{ _id: { $in: invitation.workspaces } },
		{ $addToSet: { members: user._id } },
		{ session }
	  );
	}

	// Davetiyeyi güncelle
	invitation.status = "accepted";
	await invitation.save({ session });

	await session.commitTransaction();
	return ApiResponse.success({ message: "Invitation accepted successfully" });
  } catch (error) {
	await session.abortTransaction();
	return ApiResponse.fail([new ErrorDetail(error.message)]);
  } finally {
	session.endSession();
  }
};

const getSubscriptionInvitations = async (subscriptionId, query = {}) => {
  try {
	const {
	  status = "pending",
	  page = 1,
	  limit = 20,
	  search,
	  sortBy = "createdAt",
	  sortOrder = "desc",
	} = query;

	// Query oluştur
	const filter = { subscriptionId };

	// Status filtresi
	if (status !== "all") {
	  filter.status = status;
	}

	// Search filtresi
	if (search) {
	  filter.$or = [{ inviteeEmail: { $regex: search, $options: "i" } }];
	}

	// Sort options
	const sort = {};
	sort[sortBy] = sortOrder === "desc" ? -1 : 1;

	// Pagination
	const skip = (page - 1) * limit;

	// Ana sorgu
	const invitations = await Invitation.find(filter)
	  .populate({
		path: "inviterId",
		select: "id firstName lastName profilePicture",
	  })
	  .populate({
		path: "workspaces",
		select: "name description",
	  })
	  .sort(sort)
	  .skip(skip)
	  .limit(limit);

	// Toplam sayı
	const total = await Invitation.countDocuments(filter);

	return ApiResponse.success({
	  invitations: invitations.map((invitation) => ({
		id: invitation._id,
		inviteeEmail: invitation.inviteeEmail,
		inviter: invitation.inviterId,
		status: invitation.status,
		role: invitation.role,
		workspaces: invitation.workspaces,
		createdAt: invitation.createdAt,
		expiresAt: invitation.expiresAt,
	  })),
	  pagination: {
		total,
		page: parseInt(page),
		limit: parseInt(limit),
		totalPages: Math.ceil(total / limit),
	  },
	});
  } catch (error) {
	ExceptionLogger.error("Error getting subscription invitations:", error);
	return ApiResponse.fail([
	  new ErrorDetail("Failed to get subscription invitations"),
	]);
  }
};

const revokeInvitation = async (subscriptionId, invitationId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
	const invitation = await Invitation.findOne({
	  _id: invitationId,
	  subscriptionId,
	  status: "pending",
	});

	if (!invitation) {
	  throw new Error("Invitation not found or already processed");
	}

	// Davetiyeyi güncelle
	invitation.status = "revoked";
	await invitation.save({ session });


	await session.commitTransaction();
	return ApiResponse.success({
	  message: "Invitation revoked successfully",
	  invitation: {
		id: invitation._id,
		inviteeEmail: invitation.inviteeEmail,
		status: invitation.status,
		updatedAt: invitation.updatedAt,
	  },
	});
  } catch (error) {
	await session.abortTransaction();
	ExceptionLogger.error("Error revoking invitation:", error);
	return ApiResponse.fail([new ErrorDetail(error.message)]);
  } finally {
	session.endSession();
  }
};

module.exports = {
  checkIsUserSubscriptionValid,
  getSubscriptionOverview,
  getSubscriptionMembers,
  removeUserFromSubscription,
  inviteToSubscription,
  acceptSubscriptionInvitation,
  getSubscriptionInvitations,
  revokeInvitation,
};
