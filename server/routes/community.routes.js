const express = require('express');
const router = express.Router();

const {createCommunity} = require('../controller/community.controller');
const authenticate = require("../middleware/auth");

router.post('/', authenticate, createCommunity);

module.exports = router;