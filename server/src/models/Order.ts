import { Schema, model, type Types } from 'mongoose';
import { nanoid } from 'nanoid';

import type { AddressDocument } from './User.js';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItemDocument {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export type ShippingAddressDocument = Omit<AddressDocument, '_id' | 'isDefault'>;

export interface OrderDocument {
  user: Types.ObjectId;
  orderNumber: string;
  items: OrderItemDocument[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddressDocument;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const shippingAddressSchema = new Schema<ShippingAddressDocument>(
  {
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: {
      type: String,
      default: () => `DM-${nanoid(10).toUpperCase()}`,
      unique: true,
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    stripeSessionId: { type: String, trim: true, index: true },
    stripePaymentIntentId: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: true },
);

export const Order = model<OrderDocument>('Order', orderSchema);
