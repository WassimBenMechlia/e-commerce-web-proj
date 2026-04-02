import { config } from 'dotenv';
import { z } from 'zod';

config();

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGO_URI: z
    .string()
    .min(1)
    .default('mongodb://127.0.0.1:27017/desert-modern-commerce'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('dev-access-secret-change-me-1234567890'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('dev-refresh-secret-change-me-1234567890'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_DOMAIN: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: z.string().default('Desert Modern <no-reply@example.com>'),
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin12345!'),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
