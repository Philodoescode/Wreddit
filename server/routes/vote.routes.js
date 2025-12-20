const express = require('express');
const router = express.Router();

const { votePost } = require('../controller/vote.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Voting API
 */

/**
 * @swagger
 * /api/vote:
 *   post:
 *     summary: Vote on a post or comment
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - onModel
 *               - id
 *               - type
 *             properties:
 *               onModel:
 *                 type: string
 *                 enum: [Post, Comment]
 *                 description: Type of item to vote on
 *               id:
 *                 type: string
 *                 description: ID of the item
 *               type:
 *                 type: string
 *                 enum: [up, down, remove]
 *                 description: Vote type
 *     responses:
 *       200:
 *         description: Vote recorded
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, votePost);

module.exports = router;
