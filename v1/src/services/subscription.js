const axios = require('axios');
const baseUrl = process.env.SUBSCRIPTION_API_BASE_URL;
const ExceptionLogger = require("../scripts/logger/exception");

const checkIsUserSubscriptionValid = async (subscriptionId) => {
    return true;
};

module.exports = {
    checkIsUserSubscriptionValid
}