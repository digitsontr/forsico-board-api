const httpStatus = require("http-status");
const service = require("../services/subscription");

const getSubscriptionOverview = async (req, res) => {
	const response = await service.getSubscriptionOverview(req.subscriptionId, req.accessToken);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const getSubscriptionMembers = async (req, res) => {
	const response = await service.getSubscriptionMembers(req.subscriptionId);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const removeUserFromSubscription = async (req, res) => {
	const response = await service.removeUserFromSubscription(
		req.subscriptionId,
		req.params.userId
	);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const getSubscriptionInvitations = async (req, res) => {
	const response = await service.getSubscriptionInvitations(req.subscriptionId);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const inviteToSubscription = async (req, res) => {
	const response = await service.inviteToSubscription(
		req.subscriptionId,
		req.user.sub,
		req.body,
		req.accessToken
	);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const revokeInvitation = async (req, res) => {
	const response = await service.revokeInvitation(
		req.subscriptionId,
		req.params.invitationId
	);
	res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
	getSubscriptionOverview,
	getSubscriptionMembers,
	removeUserFromSubscription,
	getSubscriptionInvitations,
	inviteToSubscription,
	revokeInvitation
}; 