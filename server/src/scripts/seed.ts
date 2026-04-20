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
    {
      name: 'Neroli Body Cleanser',
      description:
        'A gentle daily cleanser with neroli, aloe, and oat extract that leaves skin refreshed and balanced.',
      price: 38,
      compareAtPrice: 45,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1773904030888-ce95f617658b?auto=format&fit=crop&w=1200&q=80',
          alt: 'Body cleanser bottle on stone surface',
        },
      ],
      category: categories[0]!._id,
      stock: 20,
      ratings: { average: 4.7, count: 14 },
      reviews: [],
      sku: 'DM-BB-004',
      tags: ['bath', 'daily-care', 'botanical'],
      ecoBadge: 'Refill Friendly',
    },
    {
      name: 'Rose Clay Hand Balm',
      description:
        'A rich hand balm with rose clay and shea butter designed for dry hands after frequent washing.',
      price: 29,
      compareAtPrice: 36,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1602312771175-0a4f1f0f6214?auto=format&fit=crop&w=1200&q=80',
          alt: 'Hand balm tube and cap',
        },
      ],
      category: categories[0]!._id,
      stock: 26,
      ratings: { average: 4.6, count: 18 },
      reviews: [],
      sku: 'DM-BB-005',
      tags: ['hand-care', 'hydrating', 'daily'],
      ecoBadge: 'Vegan Formula',
    },
    {
      name: 'Eucalyptus Shower Steamers',
      description:
        'A six-piece steamer set infused with eucalyptus and mint to create a spa-like shower routine.',
      price: 24,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1621483943969-25aaccc0d05e?auto=format&fit=crop&w=1200&q=80',
          alt: 'Round shower steamer tablets',
        },
      ],
      category: categories[0]!._id,
      stock: 32,
      ratings: { average: 4.5, count: 27 },
      reviews: [],
      sku: 'DM-BB-006',
      tags: ['shower', 'aromatherapy', 'wellness'],
      ecoBadge: 'Plastic Free',
    },
    {
      name: 'Atlas Cedar Soap Bar',
      description:
        'A cold-processed bar soap with cedar and olive oil for a creamy, low-waste cleansing ritual.',
      price: 16,
      compareAtPrice: 19,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1746334393639-f8723da387a5?auto=format&fit=crop&w=1200&q=80',
          alt: 'Handcrafted soap bar on tray',
        },
      ],
      category: categories[0]!._id,
      stock: 44,
      ratings: { average: 4.7, count: 39 },
      reviews: [],
      sku: 'DM-BB-007',
      tags: ['soap', 'cedar', 'low-waste'],
      ecoBadge: 'Compostable Wrap',
    },
    {
      name: 'Evening Renewal Body Oil',
      description:
        'A lightweight evening body oil with jojoba and safflower to soften skin without residue.',
      price: 52,
      compareAtPrice: 60,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1605040056130-38d9faad3534?auto=format&fit=crop&w=1200&q=80',
          alt: 'Body oil bottle with dropper',
        },
      ],
      category: categories[0]!._id,
      stock: 14,
      ratings: { average: 4.8, count: 16 },
      reviews: [],
      sku: 'DM-BB-008',
      tags: ['body-oil', 'night-routine', 'self-care'],
      ecoBadge: 'Glass Bottle',
    },
    {
      name: 'Mineral Sea Salt Soak',
      description:
        'A mineral-rich soak with sea salt and chamomile that helps unwind after long workdays.',
      price: 33,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1550623685-2227f7bbef18?auto=format&fit=crop&w=1200&q=80',
          alt: 'Jar of bath soak with spoon',
        },
      ],
      category: categories[0]!._id,
      stock: 21,
      ratings: { average: 4.6, count: 22 },
      reviews: [],
      sku: 'DM-BB-009',
      tags: ['bath', 'relaxation', 'mineral'],
      ecoBadge: 'Low Waste',
    },
    {
      name: 'Citrus Cuticle Serum',
      description:
        'A quick-absorbing cuticle serum with citrus peel oils to nourish nails and surrounding skin.',
      price: 21,
      compareAtPrice: 26,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1602867005582-997b8dbf0813?auto=format&fit=crop&w=1200&q=80',
          alt: 'Small serum bottle for nails',
        },
      ],
      category: categories[0]!._id,
      stock: 30,
      ratings: { average: 4.4, count: 11 },
      reviews: [],
      sku: 'DM-BB-010',
      tags: ['nails', 'serum', 'travel-size'],
      ecoBadge: 'Pocket Size',
    },
    {
      name: 'Linen Dawn Candle',
      description:
        'A soy wax candle with linen and fig notes that creates a bright, clean morning ambience.',
      price: 48,
      compareAtPrice: 56,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1643122966676-29e8597257f7?auto=format&fit=crop&w=1200&q=80',
          alt: 'Lit candle in glass jar',
        },
      ],
      category: categories[1]!._id,
      stock: 17,
      ratings: { average: 4.7, count: 19 },
      reviews: [],
      sku: 'DM-HR-011',
      tags: ['candle', 'home', 'fragrance'],
      ecoBadge: 'Soy Wax',
    },
    {
      name: 'Vetiver Reed Diffuser',
      description:
        'A long-lasting diffuser with vetiver and cedar notes to scent living spaces without flame.',
      price: 58,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1769538515234-6f307ce6143a?auto=format&fit=crop&w=1200&q=80',
          alt: 'Reed diffuser on side table',
        },
      ],
      category: categories[1]!._id,
      stock: 13,
      ratings: { average: 4.8, count: 25 },
      reviews: [],
      sku: 'DM-HR-012',
      tags: ['diffuser', 'vetiver', 'living-room'],
      ecoBadge: 'Refill Available',
    },
    {
      name: 'Stoneware Incense Holder',
      description:
        'A matte stoneware holder designed for ash control and clean display on shelves or desks.',
      price: 27,
      compareAtPrice: 32,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1620003245338-3b12cbd59084?auto=format&fit=crop&w=1200&q=80',
          alt: 'Minimal stone incense holder',
        },
      ],
      category: categories[1]!._id,
      stock: 24,
      ratings: { average: 4.5, count: 13 },
      reviews: [],
      sku: 'DM-HR-013',
      tags: ['incense', 'decor', 'ceramic'],
      ecoBadge: 'Handcrafted',
    },
    {
      name: 'Wool Throw in Sand',
      description:
        'A soft wool throw in a warm sand tone for layered living room and bedroom comfort.',
      price: 89,
      compareAtPrice: 110,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1674475760738-8c7af859f821?auto=format&fit=crop&w=1200&q=80',
          alt: 'Wool throw blanket draped over a sofa',
        },
      ],
      category: categories[1]!._id,
      stock: 9,
      ratings: { average: 4.9, count: 9 },
      reviews: [],
      sku: 'DM-HR-014',
      tags: ['textile', 'home', 'comfort'],
      ecoBadge: 'Natural Fiber',
    },
    {
      name: 'Brass Wick Trimmer',
      description:
        'A weighted brass wick trimmer for cleaner candle burns and better fragrance throw.',
      price: 22,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1672522198298-775e232f1770?auto=format&fit=crop&w=1200&q=80',
          alt: 'Metal wick trimmer close-up',
        },
      ],
      category: categories[1]!._id,
      stock: 31,
      ratings: { average: 4.6, count: 17 },
      reviews: [],
      sku: 'DM-HR-015',
      tags: ['candle-tools', 'accessory', 'brass'],
      ecoBadge: 'Long Lasting',
    },
    {
      name: 'Quiet Hour Tea Light Set',
      description:
        'A set of twelve unscented tea lights for ambient evening lighting and mindful rituals.',
      price: 19,
      compareAtPrice: 24,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1718788392540-0862a47c8c30?auto=format&fit=crop&w=1200&q=80',
          alt: 'Tea lights arranged on tray',
        },
      ],
      category: categories[1]!._id,
      stock: 37,
      ratings: { average: 4.3, count: 12 },
      reviews: [],
      sku: 'DM-HR-016',
      tags: ['tea-lights', 'ambient', 'ritual'],
      ecoBadge: 'Paraffin Free',
    },
    {
      name: 'Amber Glass Match Cloche',
      description:
        'A decorative amber cloche with safety matches for a refined tabletop candle setup.',
      price: 25,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1616280854776-4936ab9bb4bb?auto=format&fit=crop&w=1200&q=80',
          alt: 'Amber glass cloche with matches',
        },
      ],
      category: categories[1]!._id,
      stock: 15,
      ratings: { average: 4.7, count: 10 },
      reviews: [],
      sku: 'DM-HR-017',
      tags: ['tabletop', 'accessory', 'home-style'],
      ecoBadge: 'Reusable',
    },
    {
      name: 'Weekend Reset Kit',
      description:
        'A two-day reset kit with cleanser, body oil, and sleep mist for short wellness getaways.',
      price: 72,
      compareAtPrice: 84,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1524860155154-c904628c418c?auto=format&fit=crop&w=1200&q=80',
          alt: 'Travel kit arranged in linen pouch',
        },
      ],
      category: categories[2]!._id,
      stock: 11,
      ratings: { average: 4.8, count: 20 },
      reviews: [],
      sku: 'DM-TK-018',
      tags: ['weekend', 'travel', 'gift-set'],
      ecoBadge: 'Reusable Pouch',
    },
    {
      name: 'Flight Comfort Trio',
      description:
        'A cabin-ready trio with lip balm, hand cream, and face mist to stay comfortable in dry air.',
      price: 39,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1701686794515-8e83954d609a?auto=format&fit=crop&w=1200&q=80',
          alt: 'Compact travel products on tray',
        },
      ],
      category: categories[2]!._id,
      stock: 27,
      ratings: { average: 4.5, count: 31 },
      reviews: [],
      sku: 'DM-TK-019',
      tags: ['flight', 'carry-on', 'hydration'],
      ecoBadge: 'TSA Friendly',
    },
    {
      name: 'City Explorer Grooming Set',
      description:
        'A minimalist grooming set with compact wash, cream, and deodorant for urban day trips.',
      price: 57,
      compareAtPrice: 69,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1553265472-b913dd3e32a2?auto=format&fit=crop&w=1200&q=80',
          alt: 'Travel grooming products lined up',
        },
      ],
      category: categories[2]!._id,
      stock: 16,
      ratings: { average: 4.6, count: 15 },
      reviews: [],
      sku: 'DM-TK-020',
      tags: ['grooming', 'travel', 'urban'],
      ecoBadge: 'Refill Program',
    },
    {
      name: 'Overnight Recovery Set',
      description:
        'An overnight care set with pillow mist, eye balm, and soothing roll-on for better rest away from home.',
      price: 68,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1623971069455-5b3230175bfa?auto=format&fit=crop&w=1200&q=80',
          alt: 'Night travel care set on bedside table',
        },
      ],
      category: categories[2]!._id,
      stock: 12,
      ratings: { average: 4.9, count: 14 },
      reviews: [],
      sku: 'DM-TK-021',
      tags: ['sleep', 'travel', 'night-routine'],
      ecoBadge: 'Cabin Ready',
    },
    {
      name: 'Refill Capsule Bundle',
      description:
        'A set of refill capsules for hand wash and body cleanser to reduce single-use packaging.',
      price: 41,
      compareAtPrice: 49,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1645539823877-70eb4c685960?auto=format&fit=crop&w=1200&q=80',
          alt: 'Refill capsules and bottles',
        },
      ],
      category: categories[2]!._id,
      stock: 34,
      ratings: { average: 4.4, count: 18 },
      reviews: [],
      sku: 'DM-TK-022',
      tags: ['refill', 'sustainable', 'bundle'],
      ecoBadge: 'Low Waste',
    },
    {
      name: 'Compact Wellness Roll-On Duo',
      description:
        'Two pocket roll-ons with focus and unwind blends to support energy and calm throughout the day.',
      price: 31,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1767709114023-02f6398ac7a5?auto=format&fit=crop&w=1200&q=80',
          alt: 'Two essential oil roll-on bottles',
        },
      ],
      category: categories[2]!._id,
      stock: 29,
      ratings: { average: 4.6, count: 26 },
      reviews: [],
      sku: 'DM-TK-023',
      tags: ['roll-on', 'wellness', 'travel-size'],
      ecoBadge: 'Pocket Size',
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
