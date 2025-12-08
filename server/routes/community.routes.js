const express = require('express');
const router = express.Router();

const { createCommunity, getAllCommunities, getCommunityByName, joinCommunity, leaveCommunity } = require('../controller/community.controller');
const authenticate = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");

router.post('/', authenticate, createCommunity);
router.get('/', authenticate, getAllCommunities);
router.get("/name/:name", optionalAuth, getCommunityByName);
router.post("/name/:name/join", authenticate, joinCommunity);
router.delete("/name/:name/leave", authenticate, leaveCommunity);

module.exports = router;