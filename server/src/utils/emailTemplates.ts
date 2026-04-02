import type { OrderDocument } from '../models/Order.js';
import type { UserDocument } from '../models/User.js';

export const verificationEmailTemplate = (
  name: string,
  verificationUrl: string,
) => ({
  subject: 'Verify your Desert Modern account',
  html: `
    <div style="font-family: Inter, Arial, sans-serif; color: #2C241B; background: #FDFCF8; padding: 24px;">
      <h1 style="font-size: 28px; margin-bottom: 12px;">Welcome, ${name}</h1>
      <p style="color: #8A7F76; line-height: 1.6;">Confirm your email address to activate your account and start tracking orders.</p>
      <a href="${verificationUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 18px; background: #C65D3B; color: #fff; text-decoration: none; border-radius: 8px;">Verify Email</a>
    </div>
  `,
});

export const passwordResetTemplate = (name: string, resetUrl: string) => ({
  subject: 'Reset your Desert Modern password',
  html: `
    <div style="font-family: Inter, Arial, sans-serif; color: #2C241B; background: #FDFCF8; padding: 24px;">
      <h1 style="font-size: 28px; margin-bottom: 12px;">Password reset requested</h1>
      <p style="color: #8A7F76; line-height: 1.6;">Hi ${name}, use the link below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 18px; background: #8B9D77; color: #fff; text-decoration: none; border-radius: 8px;">Reset Password</a>
    </div>
  `,
});

export const orderConfirmationTemplate = (
  user: Pick<UserDocument, 'name' | 'email'>,
  order: Pick<
    OrderDocument,
    'orderNumber' | 'items' | 'subtotal' | 'shippingFee' | 'taxAmount' | 'totalAmount'
  >,
) => {
  const itemsMarkup = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0;">${item.name}</td>
          <td style="padding: 8px 0;">${item.quantity}</td>
          <td style="padding: 8px 0;">$${item.price.toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  return {
    subject: `Your order ${order.orderNumber} is confirmed`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #2C241B; background: #FDFCF8; padding: 24px;">
        <h1 style="font-size: 28px; margin-bottom: 12px;">Thanks for your order, ${user.name}</h1>
        <p style="color: #8A7F76; line-height: 1.6;">We received your order and will notify you as it moves through processing.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
          <thead>
            <tr>
              <th align="left" style="padding-bottom: 8px;">Item</th>
              <th align="left" style="padding-bottom: 8px;">Qty</th>
              <th align="left" style="padding-bottom: 8px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
        <p style="margin-top: 20px;">Subtotal: $${order.subtotal.toFixed(2)}</p>
        <p>Shipping: $${order.shippingFee.toFixed(2)}</p>
        <p>Tax: $${order.taxAmount.toFixed(2)}</p>
        <p style="font-weight: 600; font-size: 18px;">Total: $${order.totalAmount.toFixed(2)}</p>
      </div>
    `,
  };
};
