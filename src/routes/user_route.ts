import express from "express";
const router = express.Router();
import usersController from "../controllers/usersController";
import { authMiddleware } from "../controllers/usersController"; // Middleware לאימות JWT

/**
 * @swagger
 * tags:
 *    name: Auth
 *    description: The Authentication API
 */

/**
 * @swagger
 * components:
 *    securitySchemes:
 *       bearerAuth:
 *          type: http
 *          scheme: bearer
 *          bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *    schemas:
 *       User:
 *          type: object
 *          required:
 *             - email
 *             - username
 *          properties:
 *             email:
 *                type: string
 *                description: The user email
 *             username:
 *                type: string
 *                description: The user username
 *             password:
 *                type: string
 *                description: The user password (only for local signup)
 *             profileImage:
 *                type: string
 *                description: Path to the user's profile image
 *             googleId:
 *                type: string
 *                description: The user's Google ID (for Google login)
 *          example:
 *             email: 'bob@gmail.com'
 *             username: 'bobby'
 *             password: '123456'
 *             profileImage: '/uploads/profile-1234567890.jpg' 
 */

/**
 * @swagger
 * /auth/register:
 *    post:
 *       summary: Registers a new user (local signup)
 *       tags: [Auth]
 *       requestBody:
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   $ref: '#/components/schemas/User'
 *       responses:
 *          200:
 *             description: The new user
 *             content:
 *                application/json:
 *                   schema:
 *                      $ref: '#/components/schemas/User'
 */
router.post("/register", usersController.register);

/**
 * @swagger
 * /auth/login:
 *    post:
 *       summary: User login (local)
 *       description: Authenticate user and return tokens
 *       tags:
 *          - Auth
 *       requestBody:
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   $ref: '#/components/schemas/User'
 *       responses:
 *          200:
 *             description: Successful login
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         accessToken:
 *                            type: string
 *                            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refreshToken:
 *                            type: string
 *                            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         _id:
 *                            type: string
 *                            example: 60d0fe4f5311236168a109ca
 *          400:
 *             description: Invalid credentials or request
 *          500:
 *             description: Server error
 */
router.post("/login", usersController.login);


/**
 * @swagger
 * /auth/google:
 *    get:
 *       summary: Authenticate with Google
 *       tags: [Auth]
 *       description: Redirects to Google for authentication.
 *       responses:
 *          302:  // Redirect
 *             description: Redirect to Google for authentication
 */
router.get("/google", usersController.googleAuth);

/**
 * @swagger
 * /auth/google/callback:
 *    get:
 *       summary: Google authentication callback
 *       tags: [Auth]
 *       description: Handles the callback from Google after authentication.
 *       responses:
 *          200:
 *             description: Successful Google authentication. Returns tokens.
 *          400:
 *             description: Authentication failed.
 *          500:
 *             description: Server error.
 */
router.get("/google/callback", usersController.googleAuthCallback);



/**
 * @swagger
 * /auth/refresh:
 *    post:
 *       summary: Refresh tokens
 *       description: Refresh access and refresh tokens using the provided refresh token
 *       tags:
 *          - Auth
 *       requestBody:
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      refreshToken:
 *                         type: string
 *                         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       responses:
 *          200:
 *             description: Tokens refreshed successfully
 *             content:
 *                application/json:
 *                   schema:
 *                      type: object
 *                      properties:
 *                         accessToken:
 *                            type: string
 *                            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                         refreshToken:
 *                            type: string
 *                            example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *          400:
 *             description: Invalid refresh token
 *          500:
 *             description: Server error
 */
router.post("/refresh", usersController.refresh);

/**
 * @swagger
 * /auth/logout:
 *    post:
 *       summary: User logout
 *       description: Logout user and invalidate the refresh token
 *       tags:
 *          - Auth
 *       requestBody:
 *          required: true
 *          content:
 *             application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                      refreshToken:
 *                         type: string
 *                         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       responses:
 *          200:
 *             description: Successful logout
 *          400:
 *             description: Invalid refresh token
 *          500:
 *             description: Server error
 */
router.post("/logout", usersController.logout);

// Example of a protected route
/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Example of a protected route
 *     description: This route requires authentication (JWT).
 *     security:
 *       - bearerAuth: []  // Use the defined security scheme
 *     responses:
 *       200:
 *         description: Protected data
 *       401:
 *         description: Unauthorized.  JWT token is missing or invalid.
 */
router.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: "This is a protected route!" });
});
// for now we added it from the usersController but if we need we will add the middleware file

export default router;