// server/routes/comment.routes.js
const express = require('express');
const router = express.Router();

const { createComment, getCommentsByPost, getCommentsByUser } = require('../controller/comment.controller');
const { protect } = require('../middleware/auth.middleware');

// POST /api/comments → create comment (protected)
router.post('/', protect, createComment);

// GET /api/posts/:id/comments → fetch nested comments for a post (public)
router.get('/:id/comments', getCommentsByPost);

// GET /api/comments/user/:userId -> fetch all comments by a user
router.get('/user/:userId', getCommentsByUser);

module.exports = router;