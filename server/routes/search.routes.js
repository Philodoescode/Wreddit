const express = require("express");
const router = express.Router();

const { searchAll, removeRecentSearch } = require("../controller/search.controller");
const { protect } = require("../middleware/auth.middleware.js");

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search API
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search across the application
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", protect, searchAll);

/**
 * @swagger
 * /api/search/{term}:
 *   delete:
 *     summary: Remove a recent search term
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: term
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term to remove
 *     responses:
 *       200:
 *         description: Search term removed
 */
router.delete("/:term", protect, removeRecentSearch);


module.exports = router;
