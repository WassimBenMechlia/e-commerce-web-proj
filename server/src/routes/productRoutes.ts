import { Router } from 'express';

import {
  addReview,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getProducts).post(protect, authorize('admin'), createProduct);
router.post('/:id/reviews', protect, addReview);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

export default router;
