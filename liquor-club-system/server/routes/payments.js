import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

/**
 * POST /api/payments/mpesa/stk-push
 * Initiate M-Pesa STK Push
 */
router.post('/mpesa/stk-push', authenticate, async (req, res) => {
  try {
    // Placeholder for M-Pesa integration
    res.json({
      success: true,
      message: 'M-Pesa payment initiated',
      data: {
        checkoutRequestId: 'placeholder',
        merchantRequestId: 'placeholder',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payments/mpesa/status/:transactionId
 * Check M-Pesa payment status
 */
router.get('/mpesa/status/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    res.json({
      success: true,
      data: {
        transactionId,
        status: 'completed', // placeholder
        amount: 0,
        receiptNumber: '',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/mpesa/callback
 * M-Pesa callback endpoint (webhook)
 * This is called by Safaricom
 */
router.post('/mpesa/callback', async (req, res) => {
  // Verify signature and process payment
  res.json({ ResultCode: 0, ResultDesc: 'Callback received' });
});

export default router;
