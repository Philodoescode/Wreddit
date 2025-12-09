const express = require('express');
const router = express.Router();

const { createPost } = require('../controller/post.controller');
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

module.exports = router;
