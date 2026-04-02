import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const addressSchema = z.object({
  label: z.string().min(1),
  fullName: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(6),
  isDefault: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2),
  avatar: z
    .object({
      url: z.string().url(),
      publicId: z.string().optional(),
      alt: z.string().optional(),
    })
    .optional(),
});

const sanitizeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  addresses: unknown[];
  avatar?: unknown;
  createdAt: Date;
}) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  isBanned: user.isBanned,
  addresses: user.addresses,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId).select(
    'name email role isVerified isBanned addresses avatar createdAt',
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};

export const updateProfile = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    const payload = updateProfileSchema.parse(request.body);
    const user = await getCurrentUser(request.user.id);

    user.name = payload.name;
    if (payload.avatar) {
      user.avatar = payload.avatar;
    }
    await user.save();

    response.json({
      user: sanitizeUser(user),
    });
  },
);

export const addAddress = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const payload = addressSchema.parse(request.body);
  const user = await getCurrentUser(request.user.id);

  if (payload.isDefault) {
    user.addresses = user.addresses.map((address) => ({
      ...address,
      isDefault: false,
    }));
  }

  user.addresses.push({
    _id: new Types.ObjectId(),
    ...payload,
    isDefault: payload.isDefault ?? user.addresses.length === 0,
  });

  await user.save();

  response.status(201).json({
    user: sanitizeUser(user),
  });
});

export const updateAddress = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    const payload = addressSchema.parse(request.body);
    const user = await getCurrentUser(request.user.id);
    const address = user.addresses.find(
      (item) => item._id.toString() === request.params.addressId,
    );

    if (!address) {
      throw new AppError('Address not found.', 404);
    }

    if (payload.isDefault) {
      user.addresses = user.addresses.map((item) => ({
        ...item,
        isDefault: false,
      }));
    }

    address.label = payload.label;
    address.fullName = payload.fullName;
    address.line1 = payload.line1;
    address.line2 = payload.line2;
    address.city = payload.city;
    address.state = payload.state;
    address.postalCode = payload.postalCode;
    address.country = payload.country;
    address.phone = payload.phone;
    address.isDefault = payload.isDefault ?? address.isDefault;

    await user.save();

    response.json({
      user: sanitizeUser(user),
    });
  },
);

export const removeAddress = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    const user = await getCurrentUser(request.user.id);
    const addressIndex = user.addresses.findIndex(
      (item) => item._id.toString() === request.params.addressId,
    );

    if (addressIndex === -1) {
      throw new AppError('Address not found.', 404);
    }

    const removed = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    if (removed?.isDefault && user.addresses[0]) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    response.json({
      user: sanitizeUser(user),
    });
  },
);
