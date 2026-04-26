const express = require("express");
const router = express.Router();
const { askTasteAssistant } = require("../controllers/aiController");

router.post("/taste-assistant", askTasteAssistant);

module.exports = router;