import type { CookieOptions, Response } from 'express';

import { env, isProduction } from '../config/env.js';

export const ACCESS_COOKIE_NAME = 'dm_access';
export const REFRESH_COOKIE_NAME = 'dm_refresh';

const durationToMs = (value: string) => {
  const match = value.match(/^(\d+)([mhd])$/i);
  if (!match) {
    return 15 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();

  if (unit === 'm') {
    return amount * 60 * 1000;
  }

  if (unit === 'h') {
    return amount * 60 * 60 * 1000;
  }

  return amount * 24 * 60 * 60 * 1000;
};

const createCookieOptions = (maxAge: number): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
    path: '/',
  };

  if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost') {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
};

export const setAuthCookies = (
  response: Response,
  accessToken: string,
  refreshToken: string,
) => {
  response.cookie(
    ACCESS_COOKIE_NAME,
    accessToken,
    createCookieOptions(durationToMs(env.JWT_ACCESS_EXPIRES_IN)),
  );
  response.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    createCookieOptions(durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
  );
};

export const clearAuthCookies = (response: Response) => {
  response.clearCookie(ACCESS_COOKIE_NAME, createCookieOptions(0));
  response.clearCookie(REFRESH_COOKIE_NAME, createCookieOptions(0));
};
