import { Router } from 'express';

import {
  addAddress,
  removeAddress,
  updateAddress,
  updateProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.put('/me', updateProfile);
router.post('/me/addresses', addAddress);
router.put('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', removeAddress);

export default router;
