const service = require("../services/invitation");
const httpStatus = require("http-status");

const inviteUserToBoard = async (req, res) => {
    const { inviterId, inviteeEmails, boardId } = req.body;
    const response = await service.createInvitations(req.user.sub, inviteeEmails, boardId, req.accessToken);
    res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const acceptInvitation = async (req, res) => {
    const response = await service.acceptInvitation(req.params.invitationId, req.user);
    res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const declineInvitation = async (req, res) => {
    const response = await service.declineInvitation(req.params.invitationId);
    res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

const getInvitationsForUser = async (req, res) => {
    const email = req.user.email;
    const response = await service.getInvitationsForUser(email);

    res.status(response.status ? httpStatus.OK : httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
    inviteUserToBoard,
    acceptInvitation,
    declineInvitation,
    getInvitationsForUser
};
