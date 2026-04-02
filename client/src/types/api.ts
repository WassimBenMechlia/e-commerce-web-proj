import type {
  AnalyticsResponse,
  Cart,
  Category,
  Order,
  Product,
  User,
} from './index';

export interface ApiMessage {
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  cart?: Cart;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}

export interface ProductDetailResponse {
  product: Product;
  relatedProducts: Product[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CartResponse {
  cart: Cart;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface OrderResponse {
  order: Order | null;
  checkoutUrl?: string | null;
  simulated?: boolean;
}

export type AnalyticsApiResponse = AnalyticsResponse;
