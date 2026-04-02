import { Schema, model, type Types } from 'mongoose';

import type { ImageDocument } from './User.js';
import { toSlug } from '../utils/toSlug.js';

export interface ReviewDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ProductDocument {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ImageDocument[];
  category: Types.ObjectId;
  stock: number;
  ratings: {
    average: number;
    count: number;
  };
  reviews: ReviewDocument[];
  isActive: boolean;
  sku: string;
  tags: string[];
  ecoBadge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<ImageDocument>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
);

const reviewSchema = new Schema<ReviewDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    images: {
      type: [imageSchema],
      default: [],
      validate: [(value: ImageDocument[]) => value.length > 0, 'At least one image is required.'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    reviews: { type: [reviewSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    sku: { type: String, required: true, trim: true, unique: true },
    tags: { type: [String], default: [] },
    ecoBadge: { type: String, trim: true },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

productSchema.pre('validate', function productSlug(next) {
  if (this.isModified('name')) {
    this.slug = toSlug(this.name);
  }
  next();
});

export const Product = model<ProductDocument>('Product', productSchema);
