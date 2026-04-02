import { Router } from 'express';

import {
  getAnalytics,
  getUsers,
  updateUserBanStatus,
} from '../controllers/adminController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.patch('/users/:id/ban', updateUserBanStatus);

export default router;
