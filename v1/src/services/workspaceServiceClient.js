const apiClient = require("./apiClient");
const { ErrorDetail, ApiResponse } = require("../models/apiResponse");

const WORKSPACE_SERVICE_URL =
  process.env.WORKSPACE_SERVICE_URL || "";

const workspaceServiceClient = {
  async getMyWorkspaces(token, subscriptionId) {
    try {
      const response = await apiClient.get(
        `${WORKSPACE_SERVICE_URL}/workspaces/my`,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to retrieve user's workspaces from workspace service"),
      ]);
    }
  },

  async getWorkspaceById(token, workspaceId, subscriptionId) {
    try {
      const response = await apiClient.get(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to retrieve workspace from workspace service"),
      ]);
    }
  },

  async createWorkspace(token, workspaceData, subscriptionId) {
    try {
      const response = await apiClient.post(
        `${WORKSPACE_SERVICE_URL}/workspaces`,
        { ...workspaceData, subscriptionId },
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to create workspace in workspace service"),
      ]);
    }
  },

  async updateWorkspace(token, workspaceId, updateData, subscriptionId) {
    try {
      const response = await apiClient.put(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to update workspace in workspace service"),
      ]);
    }
  },

  async deleteWorkspace(token, workspaceId, subscriptionId) {
    try {
      const response = await apiClient.delete(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to delete workspace in workspace service"),
      ]);
    }
  },

  async addMemberToWorkspace(token, workspaceId, userIds, subscriptionId) {
    try {
      const response = await apiClient.post(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}/users`,
        { userIds: userIds },
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to add member to workspace in workspace service"),
      ]);
    }
  },

  async removeMemberFromWorkspace(token, workspaceId, userId, subscriptionId) {
    try {
      const response = await apiClient.delete(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}/users`,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
          data: { userIds: [userId] },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail(
          "Failed to remove member from workspace in workspace service"
        ),
      ]);
    }
  },

  async updateWorkspaceReadyStatus(token, workspaceId, updateData, subscriptionId) {
    try {
      const response = await apiClient.patch(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}/ready-status`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to update workspace ready status in workspace service"),
      ]);
    }
  },

  async updateWorkspaceProgress(token, workspaceId, updateData, subscriptionId) {
    try {
      const response = await apiClient.patch(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}/progress`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to update workspace progress in workspace service"),
      ]);
    }
  },

  async getWorkspaceProgress(token, workspaceId, subscriptionId) {
    try {
      const response = await apiClient.get(
        `${WORKSPACE_SERVICE_URL}/workspaces/${workspaceId}/progress`,
        {
          headers: { Authorization: `Bearer ${token}`, "x-subscription-id": subscriptionId },
          params: { subscriptionId },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to get workspace progress from workspace service"),
      ]);
    }
  },
};

module.exports = workspaceServiceClient; 