import { Types } from 'mongoose';

import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

interface GuestCartItem {
  productId: string;
  quantity: number;
}

export interface CartResponseItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    image: string;
    isActive: boolean;
  };
}

export interface CartResponse {
  id: string | null;
  itemCount: number;
  subtotal: number;
  items: CartResponseItem[];
}

export const getOrCreateCart = async (userId: string) => {
  const existing = await Cart.findOne({ user: userId });
  if (existing) {
    return existing;
  }

  return Cart.create({
    user: userId,
    items: [],
  });
};

export const buildCartResponse = async (userId: string): Promise<CartResponse> => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug price stock images isActive',
  });

  if (!cart) {
    return {
      id: null,
      itemCount: 0,
      subtotal: 0,
      items: [],
    };
  }

  const items = cart.items
    .map((item) => {
      const product = item.product as unknown as {
        _id: Types.ObjectId;
        name: string;
        slug: string;
        price: number;
        stock: number;
        images: { url: string }[];
        isActive: boolean;
      };

      if (!product?._id) {
        return null;
      }

      return {
        id: item._id.toString(),
        quantity: item.quantity,
        product: {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock,
          image: product.images[0]?.url ?? '',
          isActive: product.isActive,
        },
      };
    })
    .filter((item): item is CartResponseItem => Boolean(item));

  return {
    id: cart._id.toString(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
    items,
  };
};

export const mergeGuestCartIntoUserCart = async (
  userId: string,
  guestItems: GuestCartItem[],
) => {
  if (guestItems.length === 0) {
    return;
  }

  const cart = await getOrCreateCart(userId);

  for (const guestItem of guestItems) {
    if (!Types.ObjectId.isValid(guestItem.productId) || guestItem.quantity < 1) {
      continue;
    }

    const product = await Product.findById(guestItem.productId).select(
      'stock isActive',
    );

    if (!product || !product.isActive || product.stock < 1) {
      continue;
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === guestItem.productId,
    );

    if (existingItem) {
      existingItem.quantity = Math.min(
        existingItem.quantity + guestItem.quantity,
        product.stock,
      );
      continue;
    }

    cart.items.push({
      _id: new Types.ObjectId(),
      product: product._id,
      quantity: Math.min(guestItem.quantity, product.stock),
    });
  }

  await cart.save();
};
