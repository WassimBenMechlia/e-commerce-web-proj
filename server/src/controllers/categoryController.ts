import type { Request, Response } from 'express';

import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(
  async (_request: Request, response: Response) => {
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .populate('parentCategory', 'name slug')
      .lean();

    const productCounts = await Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const productCountMap = new Map(
      productCounts.map((item) => [String(item._id), item.count]),
    );

    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      productCount: productCountMap.get(String(category._id)) ?? 0,
    }));

    response.json({
      categories: categoriesWithCounts,
    });
  },
);
