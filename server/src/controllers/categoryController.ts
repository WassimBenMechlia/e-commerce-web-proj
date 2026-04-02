import type { Request, Response } from 'express';

import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(
  async (_request: Request, response: Response) => {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .populate('parentCategory', 'name slug');

    response.json({
      categories,
    });
  },
);
