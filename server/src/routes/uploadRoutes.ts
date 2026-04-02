import { Router } from 'express';

import { uploadImage } from '../controllers/uploadController.js';
import { authorize, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/image', protect, authorize('admin'), upload.single('image'), uploadImage);

export default router;
