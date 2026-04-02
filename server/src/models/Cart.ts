import { Schema, model, type Types } from 'mongoose';

export interface CartItemDocument {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
}

export interface CartDocument {
  user: Types.ObjectId;
  items: CartItemDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItemDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true },
);

const cartSchema = new Schema<CartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart = model<CartDocument>('Cart', cartSchema);
