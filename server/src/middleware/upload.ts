import multer from 'multer';

import { AppError } from '../utils/appError.js';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_request, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
    return;
  }

  callback(new AppError('Only image uploads are allowed.', 400));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
