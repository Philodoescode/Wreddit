const express = require('express');
const router = express.Router();

const { createPost, getPosts, getPostById, summarizePost, getSummary } = require('../controller/post.controller');
const { protect } = require('../middleware/auth.middleware');
const optionalAuth = require('../middleware/optionalAuth');
const { upload, uploadErrorHandler } = require('../middleware/upload.middleware');

// POST /api/posts - Create a new post
// Middleware chain: protect -> upload.array -> createPost -> uploadErrorHandler
/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - community
 *         - author
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the post
 *         title:
 *           type: string
 *           description: The post title
 *         content:
 *           type: string
 *           description: The post content
 *         community:
 *           type: string
 *           description: Community ID
 *         author:
 *           type: string
 *           description: Author User ID
 *         media:
 *           type: array
 *           items:
 *             type: string
 *           description: List of media URLs
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         title: "My First Post"
 *         content: "This is the content of my first post."
 *         community: "60d0fe4f5311236168a109ca"
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management API
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - communityName
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               communityName:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Post created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    protect,
    upload.array('media', 10),
    createPost,
    uploadErrorHandler
);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: communityName
 *         schema:
 *           type: string
 *         description: Filter by community name
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
router.get('/', optionalAuth, getPosts)

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:id', optionalAuth, getPostById)

// router.get('/', getPosts) // Duplicate removed

/**
 * @swagger
 * /api/posts/{id}/summary:
 *   get:
 *     summary: Get post AI summary
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 */
router.get('/:id/summary', getSummary)

/**
 * @swagger
 * /api/posts/{id}/summarize:
 *   post:
 *     summary: Generate post AI summary
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Summary generated
 */
router.post('/:id/summarize', summarizePost)

// router.get('/:id', getPostById) // Duplicate removed

module.exports = router;


