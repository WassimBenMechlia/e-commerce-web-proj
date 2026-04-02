import type { Request, Response } from 'express';
import { Types, type SortOrder } from 'mongoose';
import { z } from 'zod';

import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const objectIdSchema = z.string().refine((value) => Types.ObjectId.isValid(value), {
  message: 'Invalid identifier.',
});

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  alt: z.string().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(imageSchema).min(1),
  category: objectIdSchema,
  stock: z.number().int().min(0),
  sku: z.string().min(2),
  tags: z.array(z.string()).optional(),
  ecoBadge: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(4),
});

const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  sort: z
    .enum(['newest', 'priceAsc', 'priceDesc', 'ratingDesc'])
    .default('newest'),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

const calculateRatings = (
  reviews: { rating: number }[],
): { average: number; count: number } => {
  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  const count = reviews.length;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    average: Number((total / count).toFixed(1)),
    count,
  };
};

const sortMap: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  ratingDesc: { 'ratings.average': -1, createdAt: -1 },
};

export const getProducts = asyncHandler(async (request: Request, response: Response) => {
  const query = listProductsSchema.parse(request.query);

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (query.category) {
    const category = await Category.findOne({
      $or: [{ slug: query.category }, { _id: query.category }],
    }).select('_id');

    if (category) {
      filter.category = category._id;
    }
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) {
      (filter.price as Record<string, number>).$gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      (filter.price as Record<string, number>).$lte = query.maxPrice;
    }
  }

  if (query.minRating !== undefined) {
    filter['ratings.average'] = { $gte: query.minRating };
  }

  const skip = (query.page - 1) * query.limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[query.sort] ?? sortMap.newest)
      .skip(skip)
      .limit(query.limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  response.json({
    products,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
});

export const getProductById = asyncHandler(
  async (request: Request, response: Response) => {
    const product = await Product.findById(request.params.id)
      .populate('category', 'name slug parentCategory')
      .populate('reviews.user', 'name avatar')
      .lean();

    if (!product || !product.isActive) {
      throw new AppError('Product not found.', 404);
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .limit(4)
      .sort({ 'ratings.average': -1, createdAt: -1 })
      .select('name slug price images ratings stock ecoBadge')
      .lean();

    response.json({
      product,
      relatedProducts,
    });
  },
);

export const createProduct = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = createProductSchema.parse(request.body);
    const category = await Category.findById(payload.category);

    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    const product = await Product.create({
      ...payload,
      tags: payload.tags ?? [],
      ratings: {
        average: 0,
        count: 0,
      },
    });

    response.status(201).json({
      product,
    });
  },
);

export const updateProduct = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = updateProductSchema.parse(request.body);

    if (payload.category) {
      const category = await Category.findById(payload.category);
      if (!category) {
        throw new AppError('Category not found.', 404);
      }
    }

    const product = await Product.findById(request.params.id);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    Object.assign(product, payload);
    await product.save();

    response.json({
      product,
    });
  },
);

export const deleteProduct = asyncHandler(
  async (request: Request, response: Response) => {
    const product = await Product.findByIdAndDelete(request.params.id);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    response.json({
      message: 'Product deleted successfully.',
    });
  },
);

export const addReview = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const payload = reviewSchema.parse(request.body);
  const product = await Product.findById(request.params.id);

  if (!product || !product.isActive) {
    throw new AppError('Product not found.', 404);
  }

  const existingReview = product.reviews.find(
    (review) => review.user.toString() === request.user?.id,
  );

  if (existingReview) {
    existingReview.rating = payload.rating;
    existingReview.comment = payload.comment;
    existingReview.name = request.user.name;
  } else {
    product.reviews.push({
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(request.user.id),
      name: request.user.name,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date(),
    });
  }

  product.ratings = calculateRatings(product.reviews);
  await product.save();

  response.status(201).json({
    message: 'Review saved successfully.',
    ratings: product.ratings,
    reviews: product.reviews,
  });
});
