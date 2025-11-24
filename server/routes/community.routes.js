const express = require('express');
const router = express.Router();

const {createCommunity, getAllCommunities} = require('../controller/community.controller');
const authenticate = require("../middleware/auth");

router.post('/', authenticate, createCommunity);
router.get('/', authenticate, getAllCommunities);

module.exports = router;