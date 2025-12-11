const express = require("express");
const router = express.Router();

const { searchAll } = require("../controller/search.controller");
const { protect } = require("../middleware/auth.middleware.js");

router.get("/", protect, searchAll);

module.exports = router;
