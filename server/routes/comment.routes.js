// server/routes/comment.routes.js
const express = require('express');
const router = express.Router();

const { createComment, getCommentsByPost } = require('../controller/comment.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/comments → create comment (protected)
router.post('/', protect, createComment);

// GET /api/posts/:id/comments → fetch nested comments for a post (public)
router.get('/:id/comments', getCommentsByPost);

module.exports = router;