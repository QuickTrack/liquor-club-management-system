import { Router } from 'express';
import User from '../models/User.js';
import { authenticate, authorize, generateToken } from '../middlewares/auth.js';
import { validate, validateParams, validateBody } from '../middlewares/validation.js';
import { schemas } from '../middlewares/validation.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticate, authorize('admin', 'super_admin'), validate(), async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('branchId', 'name code')
      .sort({ firstName: 1 });
    res.json({ success: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/:id
 * Get single user
 */
router.get('/:id', authenticate, validateParams(schemas.id), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('branchId', 'name code');
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create user
 */
router.post('/', authenticate, authorize('admin', 'super_admin'), validateBody(schemas.userCreate), async (req, res, next) => {
  try {
    const userData = { ...req.body, createdBy: req.userId };
    const user = new User(userData);
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
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
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', authenticate, authorize('admin', 'super_admin'), validateParams(schemas.id), validateBody({
  firstName: require('joi').string().max(50).allow(''),
  lastName: require('joi').string().max(50).allow(''),
  phone: require('joi').string().pattern(/^\+?254[0-9]{9}$/).allow(''),
  role: require('joi').string().valid('admin', 'manager', 'cashier', 'bartender', 'auditor').allow(''),
  isActive: require('joi').boolean().allow(''),
}), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!user || !user.isActive) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:id
 * Soft delete user
 */
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), validateParams(schemas.id), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/:id/reset-pin
 * Reset user PIN
 */
router.post('/:id/reset-pin', authenticate, authorize('admin'), validateParams(schemas.id), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    // Set a temporary PIN - user must change on first login
    const crypto = await import('crypto');
    const tempPin = crypto.randomInt(1000, 9999).toString();
    user.pin = tempPin;
    user.authMethod = 'pin';
    await user.save();

    res.json({ success: true, message: 'PIN reset successfully', tempPin }); // In prod, send via SMS
  } catch (error) {
    next(error);
  }
});

export default router;
