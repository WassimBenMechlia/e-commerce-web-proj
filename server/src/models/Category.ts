import { Schema, model, type Types } from 'mongoose';

import { toSlug } from '../utils/toSlug.js';

export interface CategoryDocument {
  name: string;
  slug: string;
  image?: string;
  parentCategory?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, trim: true },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function categorySlug(next) {
  if (this.isModified('name')) {
    this.slug = toSlug(this.name);
  }
  next();
});

export const Category = model<CategoryDocument>('Category', categorySchema);
