const axios = require("axios");
const fs = require("fs");
const path = require("path");

const sendEmail = async ({ to, subject, htmlPath, accessToken }) => {
  try {
    const html = fs.readFileSync(path.resolve(htmlPath), "utf-8");

    const response = await axios.post(
      `${process.env.EMAIL_API_BASE_URL}/api/mail/send`,
      {
        to,
        subject,
        html,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
