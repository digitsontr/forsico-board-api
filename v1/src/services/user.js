const axios = require('axios');
const baseUrl = process.env.AUTH_API_BASE_URL;

const fetchUserPermissons = async (userId, workspaceId) => {
    return axios.post(`${ baseUrl }/api/role/getuserrolesinworkspace`, {
        userId: userId,
        workspaceId: workspaceId
    }).then((res)=>{
        console.log(res);

        return res.data;
    }).catch(()=>{
        return [];
    })
};

module.exports = {
    fetchUserPermissons
}