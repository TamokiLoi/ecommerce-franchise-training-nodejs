import { Router } from "express";
import { API_PATH } from "../../core/constants";
import { IRoute } from "../../core/interfaces";
import { authMiddleware, validationMiddleware } from "../../core/middleware";
import AuthController from "./auth.controller";
import { LoginDto, RegisterDto } from "./dto/authCredential.dto";
import ChangePasswordDto from "./dto/changePassword.dto";

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
    this.router.post(this.path + API_PATH.AUTH_REGISTER, validationMiddleware(RegisterDto), this.authController.register);

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
    this.router.post(this.path + API_PATH.AUTH_VERIFY_TOKEN, this.authController.verifyUserToken);

    /**
     * @swagger
     * /api/auth/resend-token:
     *   post:
     *     summary: Resend verification token via email
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: user@example.com
     *     responses:
     *       200:
     *         description: Verification token resent successfully
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
     *       400:
     *         description: Invalid email or user already verified
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: User already verified or email not found
     */
    // POST domain:/api/auth/resend-token -> Resend Token via email
    this.router.post(this.path + API_PATH.AUTH_RESEND_TOKEN, this.authController.resendToken);

    /**
     * @swagger
     * /api/auth:
     *   post:
     *     summary: Login user (Set HttpOnly cookies)
     *     description: |
     *       Login for normal web usage.
     *       - Access token and refresh token are set automatically as HttpOnly cookies.
     *       - Client does NOT receive tokens in response body.
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
     *         description: Login successful. Tokens are set in HttpOnly cookies.
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
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: User is blocked or deleted
     */
    // POST domain:/api/auth -> Login (auto set cookie)
    this.router.post(this.path, validationMiddleware(LoginDto), this.authController.loginWithCookie);

    /**
     * @swagger
     * /api/auth/login-swagger:
     *   post:
     *     summary: Login user (Return JWT tokens for Swagger / API testing)
     *     description: |
     *       Login endpoint for Swagger, Postman, or external clients.
     *       - Tokens are returned in response body.
     *       - No cookies are set.
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
     *         description: Login successful. Tokens are returned in response body.
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
     *                     accessToken:
     *                       type: string
     *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     *                     refreshToken:
     *                       type: string
     *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     *       400:
     *         description: Invalid email or password
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: User is blocked or deleted
     */
    // POST domain:/api/auth/login-swagger -> Login via swagger (return token)
    this.router.post(
      this.path + API_PATH.AUTH_LOGIN_SWAGGER,
      validationMiddleware(LoginDto),
      this.authController.loginForSwagger,
    );

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
    this.router.get(this.path, authMiddleware(), this.authController.getLoginUserInfo);

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: Logout user
     *     description: |
     *       Logout endpoint for both browser and API clients.
     *
     *       - If logged in via **cookie**: cookies will be cleared.
     *       - If logged in via **Authorization header**: token will be revoked.
     *
     *       This endpoint requires authentication.
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: null
     *                   example: null
     *       401:
     *         description: Unauthorized (missing or invalid token)
     */
    // POST domain:/api/auth/logout -> Logout
    this.router.post(this.path + API_PATH.AUTH_LOGOUT, authMiddleware(), this.authController.logout);

    /**
     * @swagger
     * /api/auth/forgot-password:
     *   put:
     *     summary: Forgot password - generate and send new password via email
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: user@example.com
     *     responses:
     *       200:
     *         description: New password has been sent to user's email
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
     *       400:
     *         description: User not found, not verified, or blocked
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: User does not exist or is not eligible for password reset
     *       500:
     *         description: Failed to send email
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Failed to send reset password email
     */
    // PUT domain:/api/auth/forgot-password -> Forgot password
    this.router.put(this.path + API_PATH.AUTH_FORGOT_PASSWORD, this.authController.forgotPassword);

    /**
     * @swagger
     * /api/auth/change-password:
     *   put:
     *     summary: Change password for logged-in user
     *     security:
     *       - Bearer: []
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - old_password
     *               - new_password
     *             properties:
     *               old_password:
     *                 type: string
     *                 example: oldPassword123
     *               new_password:
     *                 type: string
     *                 example: newStrongPassword456
     *     responses:
     *       200:
     *         description: Password changed successfully
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
     *       400:
     *         description: Invalid input or business rule violation
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Old password is required
     *       401:
     *         description: Unauthorized - old password incorrect or invalid token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Old password is incorrect
     *       403:
     *         description: Forbidden - user is blocked or not allowed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: Cannot change password for default admin account
     */
    // PUT domain:/api/auth/change-password -> Forgot password
    this.router.put(
      this.path + API_PATH.AUTH_CHANGE_PASSWORD,
      authMiddleware(),
      validationMiddleware(ChangePasswordDto),
      this.authController.changePassword,
    );
  }
}
