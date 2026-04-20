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

export interface CartSyncIssue {
  itemId: string;
  productId?: string;
  name?: string;
  code: 'missing_product' | 'inactive_product' | 'out_of_stock' | 'quantity_adjusted';
  requestedQuantity: number;
  availableQuantity?: number;
}

export interface ValidatedCartResult {
  cart: CartResponse;
  changed: boolean;
  issues: CartSyncIssue[];
}

interface PopulatedCartProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: { url: string }[];
  isActive: boolean;
}

const createEmptyCartResponse = (): CartResponse => ({
  id: null,
  itemCount: 0,
  subtotal: 0,
  items: [],
});

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

export const getValidatedCart = async (
  userId: string,
): Promise<ValidatedCartResult> => {
  const cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'name slug price stock images isActive',
  });

  if (!cart) {
    return {
      cart: createEmptyCartResponse(),
      changed: false,
      issues: [],
    };
  }

  const nextItems: {
    _id: Types.ObjectId;
    product: Types.ObjectId;
    quantity: number;
  }[] = [];
  const issues: CartSyncIssue[] = [];
  let changed = false;

  const items = cart.items.reduce<CartResponseItem[]>((result, item) => {
    const product = item.product as unknown as PopulatedCartProduct | null;

    if (!product?._id) {
      changed = true;
      issues.push({
        itemId: item._id.toString(),
        code: 'missing_product',
        requestedQuantity: item.quantity,
      });
      return result;
    }

    if (!product.isActive) {
      changed = true;
      issues.push({
        itemId: item._id.toString(),
        productId: product._id.toString(),
        name: product.name,
        code: 'inactive_product',
        requestedQuantity: item.quantity,
        availableQuantity: 0,
      });
      return result;
    }

    if (product.stock < 1) {
      changed = true;
      issues.push({
        itemId: item._id.toString(),
        productId: product._id.toString(),
        name: product.name,
        code: 'out_of_stock',
        requestedQuantity: item.quantity,
        availableQuantity: 0,
      });
      return result;
    }

    const quantity = Math.min(item.quantity, product.stock);

    if (quantity !== item.quantity) {
      changed = true;
      issues.push({
        itemId: item._id.toString(),
        productId: product._id.toString(),
        name: product.name,
        code: 'quantity_adjusted',
        requestedQuantity: item.quantity,
        availableQuantity: quantity,
      });
    }

    nextItems.push({
      _id: item._id,
      product: product._id,
      quantity,
    });

    result.push({
      id: item._id.toString(),
      quantity,
      product: {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        price: product.price,
        stock: product.stock,
        image: product.images[0]?.url ?? '',
        isActive: product.isActive,
      },
    });

    return result;
  }, []);

  if (changed) {
    cart.set('items', nextItems);
    await cart.save();
  }

  return {
    cart: {
      id: cart._id.toString(),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
      items,
    },
    changed,
    issues,
  };
};

export const buildCartResponse = async (userId: string): Promise<CartResponse> =>
  (await getValidatedCart(userId)).cart;

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
