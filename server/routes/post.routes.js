const express = require('express');
const router = express.Router();

const { createPost, getPosts, getPostById } = require('../controller/post.controller');
const { protect } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth');
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

router.get('/', optionalAuth, getPosts)
router.get('/:id', optionalAuth, getPostById)


module.exports = router;
