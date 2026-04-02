export type UserRole = 'customer' | 'admin';
export type ThemeMode = 'light' | 'dark';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface ImageAsset {
  url: string;
  publicId?: string;
  alt?: string;
}

export interface Address {
  _id?: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  addresses: Address[];
  avatar?: ImageAsset;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parentCategory?: Category | null;
}

export interface Review {
  _id: string;
  user?: {
    _id: string;
    name: string;
    avatar?: ImageAsset;
  };
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ImageAsset[];
  category: Category;
  stock: number;
  ratings: {
    average: number;
    count: number;
  };
  reviews: Review[];
  isActive: boolean;
  sku: string;
  tags: string[];
  ecoBadge?: string;
  createdAt: string;
}

export interface CartProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: CartProductSummary;
}

export interface Cart {
  id: string | null;
  itemCount: number;
  subtotal: number;
  items: CartItem[];
}

export interface GuestCartItem extends CartProductSummary {
  quantity: number;
}

export interface OrderItem {
  _id: string;
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  stripeSessionId?: string;
  createdAt: string;
}

export interface AnalyticsSeriesPoint {
  _id: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsTopProduct {
  _id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface InventoryAlert {
  _id: string;
  name: string;
  stock: number;
  sku: string;
}

export interface AnalyticsResponse {
  stats: {
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    revenue: number;
  };
  revenueSeries: AnalyticsSeriesPoint[];
  topProducts: AnalyticsTopProduct[];
  inventoryAlerts: InventoryAlert[];
}
