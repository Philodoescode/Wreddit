// server/routes/comment.routes.js
const express = require('express');
const router = express.Router();

const { createComment, getCommentsByPost } = require('../controller/comment.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - post
 *         - author
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         content:
 *           type: string
 *           description: The comment content
 *         post:
 *           type: string
 *           description: Post ID
 *         author:
 *           type: string
 *           description: Author User ID
 *         parentId:
 *           type: string
 *           description: ID of parent comment (if reply)
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         content: "This is a comment."
 *         post: "60d0fe4f5311236168a109ca"
 */

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management API
 */

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - postId
 *             properties:
 *               content:
 *                 type: string
 *               postId:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, createComment);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get('/:id/comments', getCommentsByPost);

module.exports = router;