const express = require('express');
const router = express.Router();

const { createCommunity, getAllCommunities, getCommunityByName, joinCommunity, leaveCommunity } = require('../controller/community.controller');
const authenticate = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");

/**
 * @swagger
 * components:
 *   schemas:
 *     Community:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the community
 *         name:
 *           type: string
 *           description: The community name
 *         description:
 *           type: string
 *           description: The community description
 *         creator:
 *           type: string
 *           description: User ID of the creator
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs who are members
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         name: "javascript"
 *         description: "A community for JavaScript developers"
 */

/**
 * @swagger
 * tags:
 *   name: Communities
 *   description: Community management API
 */

/**
 * @swagger
 * /api/communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Community created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createCommunity);

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: Get all communities
 *     tags: [Communities]
 *     responses:
 *       200:
 *         description: List of communities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Community'
 */
router.get('/', optionalAuth, getAllCommunities);

/**
 * @swagger
 * /api/communities/name/{name}:
 *   get:
 *     summary: Get community by name
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The community name
 *     responses:
 *       200:
 *         description: Community details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Community'
 *       404:
 *         description: Community not found
 */
router.get("/name/:name", optionalAuth, getCommunityByName);

/**
 * @swagger
 * /api/communities/name/{name}/join:
 *   post:
 *     summary: Join a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The community name
 *     responses:
 *       200:
 *         description: Joined community successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Community not found
 */
router.post("/name/:name/join", authenticate, joinCommunity);

/**
 * @swagger
 * /api/communities/name/{name}/leave:
 *   delete:
 *     summary: Leave a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The community name
 *     responses:
 *       200:
 *         description: Left community successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Community not found
 */
router.delete("/name/:name/leave", authenticate, leaveCommunity);

module.exports = router;