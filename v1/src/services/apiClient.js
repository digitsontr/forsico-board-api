const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const apiClientLogger = require("../scripts/logger/apiClient");

const apiClient = axios.create();

apiClient.interceptors.request.use(
  (config) => {
    const correlationId = uuidv4();
    config.headers["X-Correlation-ID"] = correlationId;

    apiClientLogger.info("Request Sent", {
      correlationId,
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    apiClientLogger.error("Request Error", {
      message: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    apiClientLogger.info("Response Received", {
      correlationId: response.config.headers["X-Correlation-ID"],
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  (error) => {
    apiClientLogger.error("Response Error", {
      correlationId: error.config.headers["X-Correlation-ID"],
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

module.exports = apiClient; 