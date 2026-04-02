import type { NextFunction, Request, Response } from 'express';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';

import { AppError } from '../utils/appError.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

export const notFound = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  next(new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  void next;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: error.issues[0]?.message ?? 'Validation failed.',
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    response.status(400).json({
      message: Object.values(error.errors)[0]?.message ?? 'Validation failed.',
    });
    return;
  }

  if ((error as { code?: number }).code === 11000) {
    response.status(409).json({
      message: 'A unique field already exists with this value.',
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    response.status(400).json({
      message: 'Invalid identifier.',
    });
    return;
  }

  if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
    response.status(401).json({
      message: 'Authentication token is invalid or expired.',
    });
    return;
  }

  response.status(500).json({
    message: 'Internal server error.',
  });
};
