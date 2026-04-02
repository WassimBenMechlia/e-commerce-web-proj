import { env, isProduction } from '../config/env.js';
import { hasSmtpConfig, mailTransport } from '../config/email.js';
import { AppError } from './appError.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions) => {
  if (isProduction && !hasSmtpConfig) {
    throw new AppError(
      'Email delivery is not configured. Add SMTP credentials before using mail flows in production.',
      503,
    );
  }

  await mailTransport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};
