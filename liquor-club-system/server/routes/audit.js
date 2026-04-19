import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, validateParams } from '../middlewares/validation.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();

/**
 * GET /api/audit/logs
 * Get audit logs (admin only)
 */
router.get('/logs', authenticate, authorize('admin', 'super_admin', 'auditor'), validate(), async (req, res, next) => {
  try {
    const { branchId, userId, action, entity, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/entity/:entity/:entityId
 * Get audit history for a specific entity (e.g., a sale, product)
 */
router.get('/entity/:entity/:entityId', authenticate, authorize('admin', 'auditor'), validateParams({
  entity: require('joi').string().required(),
  entityId: require('joi').string().hex().length(24).required(),
}), async (req, res, next) => {
  try {
    const logs = await AuditLog.find({
      entity: req.params.entity,
      entityId: req.params.entityId,
    })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { logs } });
  } catch (error) {
    next(error);
  }
});

export default router;
