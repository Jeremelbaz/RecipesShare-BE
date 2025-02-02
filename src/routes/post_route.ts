import express from "express";
const router = express.Router();
import postsController from "../controllers/postsController";
import { authMiddleware } from "../controllers/userController";

/**
 * @swagger
 * tags:
 *    name: Posts
 *    description: The Posts API
 */

/**
 * @swagger
 * components:
 *    schemas:
 *       Post:
 *          type: object
 *          required:
 *             - title
 *             - content
 *          properties:
 *             _id:
 *                type: string
 *                description: The auto-generated id of the post
 *             title:
 *                type: string
 *                description: The title of the post
 *             content:
 *                type: string
 *                description: The content of the post
 *             owner:
 *                type: string
 *                description: The ID of the user who created the post
 *             image:
 *                type: string
 *                description: The URL of the post image
 *             likes:
 *                type: array
 *                items:
 *                  type: string
 *                description: An array of user IDs who liked the post
 *             createdAt:
 *                type: string
 *                format: date-time
 *                description: The date and time the post was created
 *             updatedAt:
 *                type: string
 *                format: date-time
 *                description: The date and time the post was last updated
 *          example:
 *             _id: 245234t234234r234r23f4
 *             title: My First Post
 *             content: This is the content of my first post.
 *             owner: 324vt23r4tr234t245tbv45by
 *             image: "/uploads/post-1234567890.jpg"
 *             likes: ["user123", "user456"]
 *             createdAt: "2024-07-27T10:00:00.000Z"
 *             updatedAt: "2024-07-27T12:00:00.000Z"
 */

/**
 * @swagger
 * /posts:
 *    get:
 *       summary: Get all posts (with pagination)
 *       description: Retrieve a list of all posts with pagination.
 *       tags:
 *          - Posts
 *       parameters:
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *           description: The page number for pagination (default 1)
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *           description: The number of posts per page (default 10)
 *       responses:
 *          200:
 *             description: A list of posts
 *             content:
 *                application/json:
 *                   schema:
 *                      type: array
 *                      items:
 *                         $ref: '#/components/schemas/Post'
 *          500:
 *             description: Server error
 */
router.get("/", postsController.getAll); // Removed .bind

/**
 * @swagger
 * /posts/{id}:
 *    get:
 *       summary: Get a post by ID
 *       description: Retrieve a single post by its ID
 *       tags:
 *          - Posts
 *       parameters:
 *          - in: path
 *            name: id
 *            schema:
 *               type: string
 *            required: true
 *            description: The ID of the post
 *       responses:
 *          200:
 *             description: A single post
 *             content:
 *                application/json:
 *                   schema:
 *                      $ref: '#/components/schemas/Post'
 *          404:
 *             description: Post not found
 *          500:
 *             description: Server error
 */
router.get("/:id", postsController.getById); 

/**
 * @swagger
 * /posts:
 *    post:
 *       summary: Create a new post
 *       description: Create a new post
 *       tags:
 *          - Posts
 *       security:
 *          - bearerAuth: []
 *       requestBody:
 *          required: true
 *          content:
 *             multipart/form-data:  // Important: For file uploads
 *                schema:
 *                   type: object
 *                   properties:
 *                      title:
 *                         type: string
 *                         description: The title of the post
 *                      content:
 *                         type: string
 *                         description: The content of the post
 *                      image:
 *                         type: string
 *                         format: binary // For file upload
 *                         description: The image file for the post
 *                   required:
 *                      - title
 *                      - content
 *       responses:
 *          201:
 *             description: Post created successfully
 *             content:
 *                application/json:
 *                   schema:
 *                      $ref: '#/components/schemas/Post'
 *          400:
 *             description: Invalid input
 *          500:
 *             description: Server error
 */
router.post("/", authMiddleware, postsController.create);


/**
 * @swagger
 * /posts/{id}:
 *    put:
 *       summary: Update a post by ID
 *       description: Update an existing post's title or content by its ID
 *       tags:
 *          - Posts
 *       security:
 *          - bearerAuth: []
 *       parameters:
 *          - in: path
 *            name: id
 *            schema:
 *               type: string
 *            required: true
 *            description: The ID of the post to update
 *       requestBody:
 *          required: true
 *          content:
 *             multipart/form-data: // For file uploads
 *                schema:
 *                   type: object
 *                   properties:
 *                      title:
 *                         type: string
 *                         description: The updated title of the post
 *                      content:
 *                         type: string
 *                         description: The updated content of the post
 *                      image:
 *                         type: string
 *                         format: binary // For file upload
 *                         description: The updated image file for the post (optional)
 *          example:
 *             title: Updated Title
 *             content: Updated content for the post.
 *       responses:
 *          200:
 *             description: Post updated successfully
 *             content:
 *                application/json:
 *                   schema:
 *                      $ref: '#/components/schemas/Post'
 *          400:
 *             description: Invalid input
 *          404:
 *             description: Post not found
 *          500:
 *             description: Server error
 */
router.put("/:id", authMiddleware, postsController.updateItem); 

/**
 * @swagger
 * /posts/{id}:
 *    delete:
 *       summary: Delete a post by ID
 *       description: Delete a single post by its ID
 *       tags:
 *          - Posts
 *       security:
 *          - bearerAuth: []
 *       parameters:
 *          - in: path
 *            name: id
 *            schema:
 *               type: string
 *            required: true
 *            description: The ID of the post
 *       responses:
 *          200:
 *             description: Post deleted successfully
 *          404:
 *             description: Post not found
 *          500:
 *             description: Server error
 */
router.delete("/:id", authMiddleware, postsController.deleteItem); // Removed .bind and added middleware

export default router;