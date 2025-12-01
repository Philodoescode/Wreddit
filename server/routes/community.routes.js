const express = require('express');
const router = express.Router();

const {createCommunity, getAllCommunities, getCommunityByName} = require('../controller/community.controller');
const authenticate = require("../middleware/auth");

router.post('/', authenticate, createCommunity);
router.get('/', authenticate, getAllCommunities);
router.get("/name/:name", getCommunityByName);

module.exports = router;