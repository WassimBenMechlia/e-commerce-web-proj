import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { Product } from '../models/Product.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildCartResponse, getOrCreateCart } from '../utils/cart.js';

const addCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20),
});

export const getCart = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  await getOrCreateCart(request.user.id);

  response.json({
    cart: await buildCartResponse(request.user.id),
  });
});

export const addToCart = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const payload = addCartItemSchema.parse(request.body);
  const product = await Product.findById(payload.productId).select(
    'name stock isActive',
  );

  if (!product || !product.isActive) {
    throw new AppError('Product not found.', 404);
  }

  if (product.stock < 1) {
    throw new AppError('This product is out of stock.', 400);
  }

  const cart = await getOrCreateCart(request.user.id);
  const existingItem = cart.items.find(
    (item) => item.product.toString() === payload.productId,
  );

  if (existingItem) {
    existingItem.quantity = Math.min(
      existingItem.quantity + payload.quantity,
      product.stock,
    );
  } else {
    cart.items.push({
      _id: new Types.ObjectId(),
      product: product._id,
      quantity: Math.min(payload.quantity, product.stock),
    });
  }

  await cart.save();

  response.status(201).json({
    cart: await buildCartResponse(request.user.id),
  });
});

export const updateCartItem = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    const payload = updateCartItemSchema.parse(request.body);
    const cart = await getOrCreateCart(request.user.id);
    const cartItem = cart.items.find(
      (item) => item._id.toString() === request.params.itemId,
    );

    if (!cartItem) {
      throw new AppError('Cart item not found.', 404);
    }

    const product = await Product.findById(cartItem.product).select('stock');

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    cartItem.quantity = Math.min(payload.quantity, product.stock || 1);
    await cart.save();

    response.json({
      cart: await buildCartResponse(request.user.id),
    });
  },
);

export const removeCartItem = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    const cart = await getOrCreateCart(request.user.id);
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === request.params.itemId,
    );

    if (itemIndex === -1) {
      throw new AppError('Cart item not found.', 404);
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    response.json({
      cart: await buildCartResponse(request.user.id),
    });
  },
);
