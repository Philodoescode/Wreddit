const express = require("express");
const router = express.Router();

const { searchAll,  removeRecentSearch} = require("../controller/search.controller");
const { protect } = require("../middleware/auth.middleware.js");

router.get("/", protect, searchAll);
router.delete("/:term", protect, removeRecentSearch);


module.exports = router;
