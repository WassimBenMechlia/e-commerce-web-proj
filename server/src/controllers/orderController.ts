import type { Request, Response } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { stripe } from '../config/stripe.js';
import { Cart } from '../models/Cart.js';
import { Order, type OrderDocument, type OrderStatus } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { shippingAddressSchema } from '../validation/addressSchema.js';
import { User } from '../models/User.js';
import { orderConfirmationTemplate } from '../utils/emailTemplates.js';
import { sendEmail } from '../utils/sendEmail.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getValidatedCart } from '../utils/cart.js';

const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  note: z
    .string()
    .trim()
    .max(250)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered']),
});

const sendOrderConfirmation = async (order: OrderDocument) => {
  const user = await User.findById(order.user).select('name email');

  if (!user) {
    return;
  }

  const email = orderConfirmationTemplate(user, order);
  await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
  });
};

const markOrderPaid = async (
  orderId: string,
  stripeSessionId?: string,
): Promise<OrderDocument | null> => {
  const order = await Order.findById(orderId);

  if (!order) {
    return null;
  }

  const wasAlreadyPaid = order.paymentStatus === 'paid';
  order.paymentStatus = 'paid';
  order.status = order.status === 'pending' ? 'processing' : order.status;
  if (stripeSessionId) {
    order.stripeSessionId = stripeSessionId;
  }
  await order.save();

  if (!wasAlreadyPaid) {
    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.product).select('stock');

        if (!product) {
          return;
        }

        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }),
    );

    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
    await sendOrderConfirmation(order);
  }

  return order;
};

export const createOrder = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const payload = createOrderSchema.parse(request.body);
  const validatedCart = await getValidatedCart(request.user.id);
  const cart = validatedCart.cart;

  if (cart.items.length === 0) {
    throw new AppError(
      validatedCart.changed
        ? 'Your cart was updated because some items are no longer available.'
        : 'Your cart is empty.',
      400,
      {
        cart,
        issues: validatedCart.issues,
      },
    );
  }

  if (validatedCart.changed) {
    throw new AppError(
      'Your cart was updated because some items changed availability. Review the latest quantities and try again.',
      409,
      {
        cart,
        issues: validatedCart.issues,
      },
    );
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product.id,
    name: item.product.name,
    image: item.product.image,
    price: item.product.price,
    quantity: item.quantity,
  }));

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = subtotal > 150 ? 0 : 12;
  const taxAmount = Number((subtotal * 0.08).toFixed(2));
  const totalAmount = Number((subtotal + shippingFee + taxAmount).toFixed(2));

  const order = await Order.create({
    user: request.user.id,
    items: orderItems,
    subtotal,
    shippingFee,
    taxAmount,
    totalAmount,
    shippingAddress: payload.shippingAddress,
    note: payload.note,
  });

  if (!stripe) {
    const paidOrder = await markOrderPaid(order._id.toString());

    response.status(201).json({
      order: paidOrder ?? order,
      checkoutUrl: null,
      simulated: true,
    });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: orderItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
    })),
    metadata: {
      orderId: order._id.toString(),
      userId: request.user.id,
    },
    customer_email: request.user.email,
    success_url: `${env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/checkout`,
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'TN'],
    },
  });

  order.stripeSessionId = session.id;
  await order.save();

  response.status(201).json({
    order,
    checkoutUrl: session.url,
    simulated: false,
  });
});

export const confirmOrderSession = asyncHandler(
  async (request: Request, response: Response) => {
    if (!request.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!stripe) {
      const order = await Order.findOne({
        user: request.user.id,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      response.json({
        order,
      });
      return;
    }

    const sessionId = z.string().min(1).parse(request.query.sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.orderId) {
      throw new AppError('Order metadata missing from Stripe session.', 400);
    }

    if (session.payment_status === 'paid') {
      await markOrderPaid(session.metadata.orderId, session.id);
    }

    const order = await Order.findById(session.metadata.orderId);
    response.json({
      order,
    });
  },
);

export const getMyOrders = asyncHandler(async (request: Request, response: Response) => {
  if (!request.user) {
    throw new AppError('Authentication required.', 401);
  }

  const orders = await Order.find({ user: request.user.id })
    .sort({ createdAt: -1 })
    .lean();

  response.json({
    orders,
  });
});

export const getOrders = asyncHandler(async (request: Request, response: Response) => {
  const status = request.query.status as OrderStatus | undefined;
  const filter = status ? { status } : {};

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .lean();

  response.json({
    orders,
  });
});

export const updateOrderStatus = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = updateOrderStatusSchema.parse(request.body);
    const order = await Order.findById(request.params.id);

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    order.status = payload.status;
    await order.save();

    response.json({
      order,
    });
  },
);

export const handleStripeWebhook = asyncHandler(
  async (request: Request, response: Response) => {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      response.status(200).json({ received: true });
      return;
    }

    const signature = request.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      throw new AppError('Stripe signature missing.', 400);
    }

    const event = stripe.webhooks.constructEvent(
      request.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata?.orderId) {
        await markOrderPaid(session.metadata.orderId, session.id);
      }
    }

    response.status(200).json({ received: true });
  },
);
