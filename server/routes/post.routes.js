const express = require('express');
const router = express.Router();

const { createPost, getPosts, getPostById, summarizePost, getSummary } = require('../controller/post.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload, uploadErrorHandler } = require('../middleware/upload.middleware');

// POST /api/posts - Create a new post
// Middleware chain: protect -> upload.array -> createPost -> uploadErrorHandler
router.post(
    '/',
    protect,
    upload.array('media', 10),
    createPost,
    uploadErrorHandler
);

router.get('/', getPosts)

// IMPORTANT: More specific routes must come BEFORE /:id
// GET /api/posts/:id/summary - Get existing summary (without generating)
router.get('/:id/summary', getSummary)

// POST /api/posts/:id/summarize - Generate AI summary for a post
router.post('/:id/summarize', summarizePost)

// This should be LAST among /:id routes since it's the catch-all
router.get('/:id', getPostById)


module.exports = router;


