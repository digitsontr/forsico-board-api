const axios = require("axios");
const baseUrl = process.env.AUTH_API_BASE_URL;
const User = require("../models/user");

const getUserById = async (userId) => {
  try {
    const user = await User.findOne({ id: userId });
    return user || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
};

const fetchUserPermissons = async (userId, workspaceId, accessToken) => {
  let data = JSON.stringify({
    userId: userId,
    workspaceId: workspaceId,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: baseUrl + "/api/Role/getUserRolesInWorkspace",
    headers: {
      "x-api-key": process.env.AUTH_API_API_KEY,
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      return response?.data?.data || [];
    })
    .catch((error, res) => {
      console.log("ERORR RES", error.response);
      return [];
    });
};

module.exports = {
  fetchUserPermissons,
  getUserById
};
