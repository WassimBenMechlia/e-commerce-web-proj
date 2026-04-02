import nodemailer from 'nodemailer';

import { env, isProduction } from './env.js';

export const hasSmtpConfig = Boolean(
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS,
);

export const mailTransport = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport(
      isProduction
        ? {
            jsonTransport: true,
          }
        : {
            jsonTransport: true,
          },
    );
