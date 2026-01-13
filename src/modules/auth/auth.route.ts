import { Router } from "express";
import { API_PATH } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, validationMiddleware } from "../../core/middleware";
import AuthController from "./auth.controller";
import { LoginDto, RegisterDto } from "./dto/authCredential";

export default class AuthRoute implements IRoute {
  public path = API_PATH.AUTH;
  public router = Router();

  constructor(private readonly authController: AuthController) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * tags:
     *   - name: Auth
     *     description: Authentication
     */

    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Register new user
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: user@gmail.com
     *               password:
     *                 type: string
     *                 minLength: 6
     *                 example: 123456
     *     responses:
     *       200:
     *         description: Register successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     _id:
     *                       type: string
     *                       example: 6786117ca2e8a8cfbf2032bf
     *                     email:
     *                       type: string
     *                       example: user@gmail.com
     *                     is_verified:
     *                       type: boolean
     *                       example: false
     *                     created_at:
     *                       type: string
     *                       format: date-time
     *                     updated_at:
     *                       type: string
     *                       format: date-time
     */
    // POST domain:/api/auth/register - Register
    this.router.post(API_PATH.AUTH_REGISTER, validationMiddleware(RegisterDto), this.authController.register);

    /**
     * @swagger
     * /api/auth/verify-token:
     *   post:
     *     summary: Verify Token for new user
     *     security:
     *      - Bearer: []
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *                 example: a6b29f364e255de7815d265c8708bb28
     *     responses:
     *       200:
     *         description: Token verified
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   nullable: true
     *                   example: null
     */
    // POST domain:/api/auth/verify-token -> Verify token for new user
    this.router.post(API_PATH.AUTH_VERIFY_TOKEN, this.authController.verifyCreateUserToken);

    /**
     * @swagger
     * /api/auth:
     *   post:
     *     summary: Login user and set authentication cookies
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: user@example.com
     *               password:
     *                 type: string
     *                 format: password
     *                 example: 12345678
     *     responses:
     *       200:
     *         description: Login successful. Access token and refresh token are set in HttpOnly cookies.
     *         headers:
     *           Set-Cookie:
     *             description: >
     *               HttpOnly cookies containing access_token and refresh_token.
     *             schema:
     *               type: string
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *       400:
     *         description: Invalid email or password
     *       403:
     *         description: User is blocked or deleted
     */
    // POST domain:/api/auth -> Login
    this.router.post("", validationMiddleware(LoginDto), this.authController.login);

    /**
     * @swagger
     * /api/auth:
     *   get:
     *     summary: Get current logged-in user info
     *     tags: [Auth]
     *     description: >
     *       Get information of the currently logged-in user.
     *       Authentication is handled via HttpOnly access_token cookie.
     *     responses:
     *       200:
     *         description: Successfully retrieved user information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       example: 64f1c2a9e1a123456789abcd
     *                     email:
     *                       type: string
     *                       example: user@example.com
     *                     role:
     *                       type: string
     *                       example: customer
     *       401:
     *         description: Unauthorized - user is not logged in or token is invalid
     */
    // GET domain:/api/auth -> Login User Info
    this.router.get("", authMiddleware(), this.authController.getLoginUserInfo);
  }
}
