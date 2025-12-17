const express = require('express');
const router = express.Router();

const { votePost } = require('../controller/vote.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/vote → upvote / downvote / remove
router.post('/', protect, votePost);

module.exports = router;
