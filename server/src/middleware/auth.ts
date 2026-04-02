import type { NextFunction, Request, Response } from 'express';

import { User } from '../models/User.js';
import type { UserRole } from '../types/auth.js';
import { AppError } from '../utils/appError.js';
import { ACCESS_COOKIE_NAME } from '../utils/cookies.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const protect = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const token = request.cookies[ACCESS_COOKIE_NAME] as string | undefined;

  if (!token) {
    next(new AppError('Authentication required.', 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select(
      'name email role isVerified isBanned',
    );

    if (!user || user.isBanned) {
      next(new AppError('Access denied.', 401));
      return;
    }

    request.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
    };

    next();
  } catch {
    next(new AppError('Authentication expired. Refresh and try again.', 401));
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError('Insufficient permissions.', 403));
      return;
    }

    next();
  };
