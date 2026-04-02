import type { Request, Response } from 'express';
import { z } from 'zod';

import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const banUserSchema = z.object({
  isBanned: z.boolean(),
});

const sanitizeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date;
  addresses: unknown[];
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  isBanned: user.isBanned,
  createdAt: user.createdAt,
  addresses: user.addresses,
});

export const getAnalytics = asyncHandler(
  async (_request: Request, response: Response) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);

    const [totals, revenueSeries, topProducts, inventoryAlerts] = await Promise.all([
      Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Product.countDocuments(),
        Order.aggregate<{ revenue: number }>([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
        ]),
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            paymentStatus: 'paid',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: {
              $sum: {
                $multiply: ['$items.quantity', '$items.price'],
              },
            },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .sort({ stock: 1, createdAt: -1 })
        .limit(8)
        .select('name stock sku')
        .lean(),
    ]);

    response.json({
      stats: {
        totalOrders: totals[0],
        totalUsers: totals[1],
        totalProducts: totals[2],
        revenue: totals[3][0]?.revenue ?? 0,
      },
      revenueSeries,
      topProducts,
      inventoryAlerts,
    });
  },
);

export const getUsers = asyncHandler(async (_request: Request, response: Response) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .select('name email role isVerified isBanned createdAt addresses')
    .lean();

  response.json({
    users: users.map(sanitizeUser),
  });
});

export const updateUserBanStatus = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = banUserSchema.parse(request.body);
    const user = await User.findById(request.params.id).select(
      'name email role isVerified isBanned createdAt addresses',
    );

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.isBanned = payload.isBanned;
    await user.save();

    response.json({
      user: sanitizeUser(user),
    });
  },
);
