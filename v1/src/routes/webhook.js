const express = require("express");
const router = express.Router();
const { userRegistered } = require("../controllers/webhook");

router.post("/userRegistered", userRegistered);

module.exports = router;
