const { Workspace, WorkspaceProgressState } = require("../models/workspace");
const User = require("../models/user");
const { Board } = require("../models/board");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/workspace");
const boardService = require("./board");
const { v4: uuidv4 } = require("uuid");
const roleServiceClient = require("./roleServiceClient");

const getAllWorkspaces = async () => {
  try {
    const workspaces = await Workspace.find({});
    return ApiResponse.success(workspaces);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};
const getWorkspacesOfUserCacheKey = (userId) => `workspaces:user:${userId}`;

const getWorkspacesOfUser = async (user, subscriptionId) => {
  try {
    const userEntity = await User.findOne({ id: user.sub });

    if (userEntity === null) {
      return ApiResponse.fail([new ErrorDetail("There is no user!")]);
    }
    console.log("USER",userEntity);
    console.log("SUBSCRIPTION ID", subscriptionId);
    const workspaces = await Workspace.find(
      {
        members: userEntity._id,
        isDeleted: false,
        subscriptionId: subscriptionId
      },
      "name description owner members progress"
    ).populate({
      path: "boards",
      match: { members: userEntity._id, isDeleted: false },
      select: "id name members",
      options: { sort: { createdAt: 1 } },
      populate: [
        {
          path: "members",
          select: "id firstName lastName profilePicture",
        },
        {
          path: "lists",
          select: "_id name",
          options: { sort: { createdAt: 1 } },
        },
      ],
    });

    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspacesOfSubscription = async (subscriptionId) => {
  try {
    const workspaces = await Workspace.find(
      {
        subscriptionId: subscriptionId,
        isDeleted: false,
      },
      "name _id"
    );
    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspaceById = async (id) => {
  try {
    const workspace = await Workspace.findById(id)
      .populate("members", "id firstName lastName profilePicture")
      .populate("owner", "id firstName lastName profilePicture")
      .populate("boards", "_id name description")
      .select("+progress");

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    return ApiResponse.success(workspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspace")]);
  }
};

const createWorkspace = async (workspaceData, user, accessToken, subscriptionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let savedWorkspace;

  try {
    const userEntity = await User.findOne({ id: user.sub });

    const workspace = new Workspace({
      name: workspaceData.name,
      description: workspaceData.description,
      members: [userEntity._id],
      owner: [userEntity._id],
      subscriptionId: subscriptionId,
      isReady: false,
      progress: {
        state: WorkspaceProgressState.INITIAL,
        lastUpdated: new Date(),
        history: [{
          state: WorkspaceProgressState.INITIAL,
          timestamp: new Date()
        }]
      }
    });

    savedWorkspace = await workspace.save({ session });

    let existingUser = await User.findOne({ id: user.sub }).session(session);

    let userToSave;
    if (!existingUser) {
      userToSave = new User({
        id: user.sub,
        firstName: user.name,
        lastName: user.family_name,
        profilePicture: user.picture,
        workspaces: [savedWorkspace._id],
      });
    } else {
      existingUser.workspaces.push(savedWorkspace._id);
      userToSave = existingUser;
    }

    await userToSave.save({ session });

    savedWorkspace.members.push(userToSave._id);
    savedWorkspace.owner = userToSave._id;

    await savedWorkspace.save({ session });
    await saveWorkspaceToAuthApi(
      savedWorkspace._id,
      savedWorkspace.name,
      accessToken
    );

    await session.commitTransaction();
    session.endSession();
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to create workspace")]);
  } finally {
    session.endSession();
  }

  await boardService.createBoard(savedWorkspace._id, user.sub, {
    name: "General",
  });

  return ApiResponse.success(savedWorkspace);
};

const updateWorkspace = async (workspaceId, updateData) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { ...updateData },
      { new: true }
    ).select("+progress");

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    return ApiResponse.success(workspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace")]);
  }
};

const deleteWorkspace = async (id) => {
  try {
    const deletionId = uuidv4();
    Logger.log(
      "info",
      "WORKSPACE REMOVE OPERATION STARTED DELETION ID: " + deletionId
    );

    const workspace = await Workspace.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletionId: deletionId,
    });

    await boardService.deleteBoardsByWorkspaceId(id, deletionId);
    return ApiResponse.success(workspace);
  } catch (e) {
    Logger.log("error", `Failed to remove workspace: ${e.message}`);

    return ApiResponse.fail([new ErrorDetail("Failed to remove workspace")]);
  }
};

const saveWorkspaceToAuthApi = async (id, name, accessToken) => {
  // Simplified: No external API call needed for monolithic architecture
  Logger.log('info', `Workspace ${id} (${name}) saved locally - no external API call needed`);
  return {
    status: true,
    message: "Workspace saved successfully"
  };
};

const addMemberToWorkspace = async (workspaceId, userData) => {
  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    let user = await User.findOne({ id: userData.id }, "_id");

    if (!user) {
      user = new User({
        id: userData.userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture,
        workspaces: [workspaceId],
      });

      await user.save();
    }

    if (!workspace.members.includes(user._id)) {
      workspace.members.push(user._id);
      await workspace.save();
    } else {
      return ApiResponse.fail([
        new ErrorDetail("User is already a member of this board"),
      ]);
    }

    return ApiResponse.success(workspace);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to add member to workspace")]);
  }
};

const removeMemberFromWorkspace = async (workspaceId, userId) => {
  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    const user = await User.findOne({ id: userId }, "_id");

    if (!user) {
      return ApiResponse.fail([new ErrorDetail("User not found")]);
    }

    const memberIndex = workspace.members.indexOf(user._id);

    if (memberIndex === -1) {
      return ApiResponse.fail([
        new ErrorDetail("User is not a member of this workspace"),
      ]);
    }

    workspace.members.splice(memberIndex, 1);
    await workspace.save();

    return ApiResponse.success(workspace);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to remove member from workspace")]);
  }
};

const updateWorkspaceReadyStatus = async (workspaceId, isReady) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { isReady: isReady },
      { new: true }
    );

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    return ApiResponse.success(workspace);
  } catch (error) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace ready status")]);
  }
};

const updateWorkspaceProgress = async (workspaceId, newState) => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    // State geçişlerini validate et
    const isValidTransition = validateStateTransition(workspace.progress.state, newState);
    if (!isValidTransition) {
      return ApiResponse.fail([new ErrorDetail(`Invalid state transition from ${workspace.progress.state} to ${newState}`)]);
    }

    workspace.progress.state = newState;
    await workspace.save();

    return ApiResponse.success(workspace);
  } catch (error) {
    Logger.error("Error updating workspace progress:", error);
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace progress")]);
  }
};

const validateStateTransition = (currentState, newState) => {
  const validTransitions = {
    [WorkspaceProgressState.INITIAL]: [WorkspaceProgressState.WAITING_TASKS],
    [WorkspaceProgressState.WAITING_TASKS]: [WorkspaceProgressState.TASKS_CREATED],
    [WorkspaceProgressState.TASKS_CREATED]: [WorkspaceProgressState.COMPLETE],
    [WorkspaceProgressState.COMPLETE]: [] // Complete state'inden başka state'e geçiş yok
  };

  return validTransitions[currentState]?.includes(newState) ?? false;
};

const getWorkspaceProgress = async (workspaceId) => {
  try {
    const workspace = await Workspace.findById(workspaceId, 'progress');
    
    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    return ApiResponse.success(workspace.progress);
  } catch (error) {
    Logger.error("Error getting workspace progress:", error);
    return ApiResponse.fail([new ErrorDetail("Failed to get workspace progress")]);
  }
};

const getWorkspaceMembersWithRoles = async (workspaceId, subscriptionId) => {
  try {
    // 1. Get workspace with members and boards
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      subscriptionId: subscriptionId,
      isDeleted: false
    }).populate('members', 'id firstName lastName email profilePicture')
      .populate('boards', '_id name');

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    // 2. Get all workspace members
    const workspaceMembers = workspace.members;

    if (!workspaceMembers || workspaceMembers.length === 0) {
      return ApiResponse.success([]);
    }

    // 3. Get all boards in workspace
    const workspaceBoards = workspace.boards;

    // 4. For each member, get their roles and board memberships
    const membersWithRoles = await Promise.all(
      workspaceMembers.map(async (member) => {
        try {
          // Get workspace role from role service
          const workspaceRoles = await roleServiceClient.getUserRolesByScope({
            userId: member.id,
            subscriptionId: subscriptionId,
            scopeType: 'workspace',
            scopeId: workspaceId
          });

          Logger.log('debug', 'Workspace roles for member', {
            memberId: member.id,
            workspaceRoles: workspaceRoles
          });

          // Get user's board memberships
          // Board.members contains User ObjectIds, not user.id strings
          Logger.log('debug', 'Searching boards for member', {
            memberId: member.id,
            memberObjectId: member._id,
            workspaceId
          });

          const userBoards = await Board.find({
            workspaceId: workspaceId,
            members: member._id, // Board.members array contains User ObjectIds
            isDeleted: false
          }, '_id name');

          Logger.log('debug', 'Found boards for member', {
            memberId: member.id,
            boardCount: userBoards.length,
            boards: userBoards.map(b => ({ id: b._id, name: b.name }))
          });

          // Get board roles for each board
          const boardsWithRoles = await Promise.all(
            userBoards.map(async (board) => {
              try {
                const boardRoles = await roleServiceClient.getUserRolesByScope({
                  userId: member.id,
                  subscriptionId: subscriptionId,
                  scopeType: 'board',
                  scopeId: board._id.toString()
                });

                return {
                  boardId: board._id.toString(),
                  boardName: board.name,
                  userRole: boardRoles.length > 0 ? boardRoles[0].roleTemplateName : null
                };
              } catch (error) {
                Logger.log('error', 'Error getting board role', {
                  error: error.message,
                  userId: member.id,
                  boardId: board._id
                });

                return {
                  boardId: board._id.toString(),
                  boardName: board.name,
                  userRole: null // No role found
                };
              }
            })
          );

          return {
            userId: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            profilePicture: member.profilePicture || null,
            workspaceRole: workspaceRoles.length > 0 ? workspaceRoles[0].roleTemplateName : null,
            boards: boardsWithRoles
          };
        } catch (error) {
          Logger.log('error', 'Error processing member roles', {
            error: error.message,
            userId: member.id,
            workspaceId
          });

          // Return member with default roles if role service fails
          return {
            userId: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            profilePicture: member.profilePicture || null,
            workspaceRole: null,
            boards: []
          };
        }
      })
    );

    Logger.log('info', 'Retrieved workspace members with roles', {
      workspaceId,
      memberCount: membersWithRoles.length
    });

    return ApiResponse.success(membersWithRoles);
  } catch (error) {
    Logger.log('error', 'Error getting workspace members with roles', {
      error: error.message,
      workspaceId,
      subscriptionId
    });

    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspace members with roles")]);
  }
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMemberToWorkspace,
  removeMemberFromWorkspace,
  updateWorkspaceReadyStatus,
  updateWorkspaceProgress,
  getWorkspaceProgress,
  getWorkspacesOfSubscription,
  getWorkspaceMembersWithRoles
};
