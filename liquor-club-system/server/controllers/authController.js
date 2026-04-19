import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken, generateRefreshToken } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';
import { schemas } from '../middlewares/validation.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/auth/login
 * Standard email/password login
 */
export const login = async (req, res, next) => {
  try {
    const { error } = schemas.login.validate(req.body);
    if (error) {
      throw new AppError('Invalid login credentials', 400, 'VALIDATION_ERROR');
    }

    const { email, password, branchId } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check branch access
    if (user.branchId.toString() !== branchId) {
      throw new AppError('User not assigned to this branch', 403, 'BRANCH_MISMATCH');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts
      user.incrementLoginAttempts();
      await user.save();

      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts and set last login
    user.resetLoginAttempts(req.ip);
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log successful login
    logger.info(`User ${user.email} logged in successfully`, { userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
          employeeId: user.employeeId,
          profilePicture: user.profilePicture,
          permissions: user.permissions,
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/pin-login
 * Quick PIN login (for bartenders/cashiers)
 */
export const pinLogin = async (req, res, next) => {
  try {
    const { error } = schemas.pinLogin.validate(req.body);
    if (error) {
      throw new AppError('Invalid request', 400, 'VALIDATION_ERROR');
    }

    const { phone, pin, branchId } = req.body;

    const user = await User.findOne({ phone, isActive: true });

    if (!user || user.authMethod !== 'pin') {
      throw new AppError('Invalid PIN or user not configured for PIN login', 401, 'INVALID_PIN');
    }

    // Verify PIN
    const isMatch = await user.comparePin(pin);

    if (!isMatch) {
      user.incrementLoginAttempts();
      await user.save();
      throw new AppError('Invalid PIN', 401, 'INVALID_PIN');
    }

    // Check branch
    if (user.branchId.toString() !== branchId) {
      throw new AppError('User not assigned to this branch', 403, 'BRANCH_MISMATCH');
    }

    user.resetLoginAttempts(req.ip);
    await user.save();

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User ${user.phone} logged in via PIN`, { userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
          employeeId: user.employeeId,
          permissions: user.permissions,
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user); // Optional: rotate refresh tokens

    res.json({
      success: true,
      data: {
        tokens: {
          access: newAccessToken,
          refresh: newRefreshToken,
        },
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * User logout (blacklist token if needed)
 */
export const logout = async (req, res) => {
  // In a production system, you'd blacklist the token
  // For simplicity, client discards token
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findById(req.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    // Update password (triggers pre-save hash)
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset (would send email/SMS)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });

    // Don't reveal if user exists
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    }

    // Generate reset token (JWT)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email/SMS with reset link using integration service
    // await sendResetEmail(user.email, resetToken);

    logger.info(`Password reset requested for ${email}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password_reset') {
      throw new AppError('Invalid reset token', 400, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN',
      });
    }
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role,
        branchId: req.user.branchId,
        employeeId: req.user.employeeId,
        profilePicture: req.user.profilePicture,
        permissions: req.user.permissions,
        lastLogin: req.user.lastLogin,
      },
    },
  });
};

export default {
  login,
  pinLogin,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getProfile,
};
