import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

const verifyToken = promisify(jwt.verify);

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = await verifyToken(token, process.env.JWT_SECRET) as {
      userId: string;
      role: string;
      branchId: string;
    };

    // Fetch user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
        code: 'UNAUTHORIZED',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        error: 'Account temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil,
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.role = user.role;
    req.branchId = user.branchId;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Middleware to authorize based on roles
 * Usage: authorize('admin', 'manager') - allows admin OR manager
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    // Super admin has access to everything
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};

/**
 * Middleware to check permission
 * Requires specific permission string, not just role
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    // Super admin bypasses permission checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user has the permission
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        code: 'FORBIDDEN',
        permissionRequired: permission,
      });
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token, just attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.role = user.role;
        req.branchId = user.branchId;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id,
    tokenVersion: user.tokenVersion || 0,
  };

  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d',
  });
};

/**
 * Middleware to require active branch context (for multi-branch)
 */
export const requireBranch = (req, res, next) => {
  if (!req.branchId) {
    return res.status(400).json({
      error: 'Branch context required',
      code: 'BRANCH_REQUIRED',
    });
  }
  next();
};

export default {
  authenticate,
  authorize,
  checkPermission,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  requireBranch,
};
