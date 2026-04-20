import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { hasSmtpConfig } from '../config/email.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { addressSchema } from '../validation/addressSchema.js';
import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from '../utils/cookies.js';
import { verificationEmailTemplate, passwordResetTemplate } from '../utils/emailTemplates.js';
import { sendEmail } from '../utils/sendEmail.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildCartResponse, mergeGuestCartIntoUserCart } from '../utils/cart.js';
import {
  createAccessToken,
  createOpaqueToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/tokens.js';

const guestCartItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(20),
});

const trimmedEmailSchema = z.string().trim().email();

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: trimmedEmailSchema,
  password: z.string().min(8),
  addresses: z.array(addressSchema).optional(),
});

const loginSchema = z.object({
  email: trimmedEmailSchema,
  password: z.string().min(8),
  guestCart: z.array(guestCartItemSchema).optional(),
});

const forgotPasswordSchema = z.object({
  email: trimmedEmailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10),
  password: z.string().min(8),
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

const buildVerificationUrl = (token: string) =>
  `${env.CLIENT_URL}/verify-email/${token}`;

const buildResetUrl = (token: string) =>
  `${env.CLIENT_URL}/reset-password/${token}`;

const isLocalEmailFallbackMode =
  env.NODE_ENV !== 'production' && !hasSmtpConfig;

export const register = asyncHandler(async (request: Request, response: Response) => {
  const payload = registerSchema.parse(request.body);

  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError('An account already exists with that email.', 409);
  }

  const password = await bcrypt.hash(payload.password, 12);
  const normalizedAddresses =
    payload.addresses?.map((address, index) => ({
      ...address,
      isDefault: address.isDefault ?? index === 0,
    })) ?? [];

  const verificationToken = isLocalEmailFallbackMode ? null : createOpaqueToken();

  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password,
    addresses: normalizedAddresses,
    isVerified: isLocalEmailFallbackMode,
    emailVerificationToken: verificationToken?.hash,
    emailVerificationExpires: verificationToken
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : undefined,
  });

  if (verificationToken) {
    const mail = verificationEmailTemplate(
      user.name,
      buildVerificationUrl(verificationToken.token),
    );

    await sendEmail({
      to: user.email,
      subject: mail.subject,
      html: mail.html,
    });
  }

  response.status(201).json({
    message: verificationToken
      ? 'Registration successful. Check your inbox to verify your email.'
      : 'Registration successful. Email verification is skipped in local development.',
    requiresEmailVerification: Boolean(verificationToken),
  });
});

export const verifyEmail = asyncHandler(async (request: Request, response: Response) => {
  const token = z.string().min(10).parse(request.params.token);
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select(
    '+emailVerificationToken +emailVerificationExpires name email role isVerified isBanned addresses avatar createdAt',
  );

  if (!user) {
    throw new AppError('Email verification link is invalid or expired.', 400);
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  response.json({
    message: 'Email verified successfully. You can now sign in.',
  });
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const payload = loginSchema.parse(request.body);

  const user = await User.findOne({ email: payload.email.toLowerCase() }).select(
    '+password +refreshTokens name email role isVerified isBanned addresses avatar createdAt',
  );

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.password);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isVerified && isLocalEmailFallbackMode) {
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  }

  if (!user.isVerified) {
    throw new AppError('Verify your email before signing in.', 403);
  }

  if (user.isBanned) {
    throw new AppError('This account has been disabled.', 403);
  }

  const accessToken = createAccessToken(user._id.toString(), user.role);
  const refreshToken = createRefreshToken(user._id.toString());

  user.refreshTokens = [...user.refreshTokens, refreshToken.hash];
  await user.save();

  if (payload.guestCart?.length) {
    await mergeGuestCartIntoUserCart(user._id.toString(), payload.guestCart);
  }

  setAuthCookies(response, accessToken, refreshToken.token);

  response.json({
    user: sanitizeUser(user),
    cart: await buildCartResponse(user._id.toString()),
  });
});

export const logout = asyncHandler(async (request: Request, response: Response) => {
  const refreshToken = request.cookies[REFRESH_COOKIE_NAME] as string | undefined;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await User.findById(payload.sub).select('+refreshTokens');

      if (user) {
        const tokenHash = hashToken(refreshToken);
        user.refreshTokens = user.refreshTokens.filter((value) => value !== tokenHash);
        await user.save();
      }
    } catch {
      // Best-effort logout. Expired refresh tokens are safe to ignore here.
    }
  }

  clearAuthCookies(response);
  response.json({
    message: 'Logged out successfully.',
  });
});

export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const refreshToken = request.cookies[REFRESH_COOKIE_NAME] as string | undefined;

  if (!refreshToken) {
    throw new AppError('Refresh token is missing.', 401);
  }

  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const user = await User.findById(payload.sub).select(
    '+refreshTokens name email role isVerified isBanned addresses avatar createdAt',
  );

  if (!user || !user.refreshTokens.includes(tokenHash) || user.isBanned) {
    throw new AppError('Refresh token is invalid.', 401);
  }

  const nextAccessToken = createAccessToken(user._id.toString(), user.role);
  const nextRefreshToken = createRefreshToken(user._id.toString());

  user.refreshTokens = user.refreshTokens
    .filter((value) => value !== tokenHash)
    .concat(nextRefreshToken.hash);
  await user.save();

  setAuthCookies(response, nextAccessToken, nextRefreshToken.token);

  response.json({
    user: sanitizeUser(user),
  });
});

export const forgotPassword = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = forgotPasswordSchema.parse(request.body);

    const user = await User.findOne({ email: payload.email.toLowerCase() }).select(
      '+passwordResetToken +passwordResetExpires name email',
    );

    if (user) {
      const resetToken = createOpaqueToken();
      user.passwordResetToken = resetToken.hash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = buildResetUrl(resetToken.token);

      if (!isLocalEmailFallbackMode) {
        const mail = passwordResetTemplate(user.name, resetUrl);
        await sendEmail({
          to: user.email,
          subject: mail.subject,
          html: mail.html,
        });
      }

      response.json({
        message: isLocalEmailFallbackMode
          ? 'Password reset link generated for local development.'
          : 'If an account exists with that email, a reset link has been sent.',
        resetUrl: isLocalEmailFallbackMode ? resetUrl : undefined,
      });
      return;
    }

    response.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  },
);

export const resetPassword = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = resetPasswordSchema.parse(request.body);

    const user = await User.findOne({
      passwordResetToken: hashToken(payload.token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires +refreshTokens');

    if (!user) {
      throw new AppError('Password reset link is invalid or expired.', 400);
    }

    user.password = await bcrypt.hash(payload.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    clearAuthCookies(response);

    response.json({
      message: 'Password updated successfully. Sign in with your new password.',
    });
  },
);

export const getMe = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await User.findById(request.user.id).select(
    'name email role isVerified isBanned addresses avatar createdAt',
  );

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  response.json({
    user: sanitizeUser(user),
  });
});
