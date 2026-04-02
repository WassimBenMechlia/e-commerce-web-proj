import bcrypt from 'bcryptjs';

import { connectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({
      email: { $in: [env.SEED_ADMIN_EMAIL.toLowerCase(), 'customer@example.com'] },
    }),
  ]);

  const categories = await Category.insertMany([
    {
      name: 'Bath & Body',
      slug: 'bath-body',
      image:
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Home Rituals',
      slug: 'home-rituals',
      image:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Travel Kits',
      slug: 'travel-kits',
      image:
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    },
  ]);

  await Product.insertMany([
    {
      name: 'Cedar Hand Wash',
      description:
        'A grounding botanical wash with cedarwood, bergamot, and mandarin peel for everyday sink rituals.',
      price: 34,
      compareAtPrice: 42,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
          alt: 'Amber bottle hand wash',
        },
      ],
      category: categories[0]!._id,
      stock: 18,
      ratings: { average: 4.8, count: 12 },
      reviews: [],
      sku: 'DM-HW-001',
      tags: ['bestseller', 'botanical', 'sinkside'],
      ecoBadge: 'Refill Friendly',
    },
    {
      name: 'Santal Room Mist',
      description:
        'A warm room mist layered with sandalwood, vetiver, and citrus peel for a quiet evening atmosphere.',
      price: 46,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          alt: 'Minimalist room mist bottle',
        },
      ],
      category: categories[1]!._id,
      stock: 7,
      ratings: { average: 4.6, count: 8 },
      reviews: [],
      sku: 'DM-RM-002',
      tags: ['home', 'fragrance'],
      ecoBadge: 'Low Waste',
    },
    {
      name: 'Daily Travel Kit',
      description:
        'A compact essentials set for carry-on packing with cleanser, balm, and restorative hand cream.',
      price: 64,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
          alt: 'Travel pouch with skincare products',
        },
      ],
      category: categories[2]!._id,
      stock: 4,
      ratings: { average: 4.9, count: 21 },
      reviews: [],
      sku: 'DM-TK-003',
      tags: ['travel', 'giftable'],
      ecoBadge: 'Cabin Ready',
    },
  ]);

  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);

  await User.create([
    {
      name: 'Admin User',
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      password: passwordHash,
      role: 'admin',
      isVerified: true,
      addresses: [],
    },
    {
      name: 'Sample Customer',
      email: 'customer@example.com',
      password: passwordHash,
      role: 'customer',
      isVerified: true,
      addresses: [
        {
          label: 'Home',
          fullName: 'Sample Customer',
          line1: '123 Palm Street',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'USA',
          phone: '+1 555 0100',
          isDefault: true,
        },
      ],
    },
  ]);

  process.stdout.write('Seed completed successfully.\n');
  process.exit(0);
};

void seed();
