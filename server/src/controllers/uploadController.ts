import type { Request, Response } from 'express';

import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uploadBuffer = (buffer: Buffer) =>
  new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'desert-modern-commerce',
      },
      (error, result) => {
        if (error || !result) {
          reject(error instanceof Error ? error : new Error('Upload failed.'));
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });

export const uploadImage = asyncHandler(async (request: Request, response: Response) => {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      'Cloudinary is not configured. Add Cloudinary credentials to enable uploads.',
      503,
    );
  }

  if (!request.file?.buffer) {
    throw new AppError('No image file was provided.', 400);
  }

  const result = await uploadBuffer(request.file.buffer);

  response.status(201).json({
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});
