const express = require("express");
const { sendMessage } = require("../controllers/messageControllers");

const router = express.Router();

// Route to post a new message
router.post('/', sendMessage);


module.exports = router;