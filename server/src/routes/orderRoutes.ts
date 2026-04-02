import { Router } from 'express';

import {
  confirmOrderSession,
  createOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.get('/my-orders', protect, getMyOrders);
router.get('/confirm', protect, confirmOrderSession);
router.route('/').post(protect, createOrder).get(protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

export default router;
