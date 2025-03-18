import express from "express";
const router = express.Router();
import commentsController from "../controllers/commentsController";
import { authMiddleware } from "../controllers/userController";

/**
 * @swagger
 * tags:
 *   - name: Comments
 *     description: The Comments API
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - postId
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *         content:
 *           type: string
 *           description: The content of the comment
 *         postId:
 *           type: string
 *           description: The ID of the associated post
 *         owner:
 *           type: string
 *           description: The ID of the comment owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the comment was last updated
 *       example:
 *         _id: 12345abcde
 *         content: This is a comment.
 *         postId: 67890fghij
 *         owner: 54321zyxwv
 *         createdAt: "2024-07-27T10:00:00.000Z"
 *         updatedAt: "2024-07-27T12:00:00.000Z"
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments for a post
 *     description: Retrieve a list of all comments for a specific post.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: query
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post to get comments for
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing or invalid postId
 *       500:
 *         description: Server error
 */
router.get("/", commentsController.getAll.bind(commentsController)); 

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Retrieve a comment by ID
 *     description: Retrieve a single comment by its ID. Typically, comments are retrieved by postId.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: A single comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.get("/:id", commentsController.getById.bind(commentsController));

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     description: Create a new comment for a post.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *               postId:
 *                 type: string
 *                 description: The ID of the post associated with the comment
 *             required:
 *               - content
 *               - postId
 *       example:
 *         content: This is a new comment.
 *         postId: 67890fghij
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input (missing content or postId)
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, commentsController.create.bind(commentsController)); 

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment by ID
 *     description: Update an existing comment's content.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The updated content of the comment
 *           example:
 *             content: Updated content for the comment.
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input (missing content)
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authMiddleware, commentsController.updateItem.bind(commentsController)); 

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment by ID
 *     description: Delete a single comment by its ID
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authMiddleware, commentsController.deleteItem.bind(commentsController));

export default router;