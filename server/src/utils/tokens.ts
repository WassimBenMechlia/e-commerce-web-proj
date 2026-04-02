import { createHash, randomBytes } from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import { env } from '../config/env.js';
import type { UserRole } from '../types/auth.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

const accessTokenExpiry = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'];
const refreshTokenExpiry = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'];

export const hashToken = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export const createAccessToken = (userId: string, role: UserRole) =>
  jwt.sign(
    {
      sub: userId,
      role,
      type: 'access',
    } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: accessTokenExpiry,
    },
  );

export const createRefreshToken = (userId: string) => {
  const token = jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: nanoid(18),
    } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: refreshTokenExpiry,
    },
  );

  return {
    token,
    hash: hashToken(token),
  };
};

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

export const createOpaqueToken = () => {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    hash: hashToken(token),
  };
};
