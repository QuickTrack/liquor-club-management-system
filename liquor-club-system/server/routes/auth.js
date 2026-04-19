import { Router } from 'express';
import {
  login,
  pinLogin,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';

const router = Router();

/**
 * POST /api/auth/login
 * Standard login with email and password
 */
router.post('/login', validateBody(schemas.login), login);

/**
 * POST /api/auth/pin-login
 * Quick PIN login for staff
 */
router.post('/pin-login', validateBody(schemas.pinLogin), pinLogin);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, getProfile);

/**
 * POST /api/auth/change-password
 * Change password
 */
router.post('/change-password', authenticate, validateBody({
  currentPassword: require('joi').string().required(),
  newPassword: require('joi').string().min(8).required(),
}), changePassword);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', validateBody({
  email: require('joi').string().email().required(),
}), forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', validateBody({
  token: require('joi').string().required(),
  newPassword: require('joi').string().min(8).required(),
}), resetPassword);

export default router;
