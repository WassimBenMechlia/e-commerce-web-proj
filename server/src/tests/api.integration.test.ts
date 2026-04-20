import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { Express } from 'express';

let app: Express;
let mongoServer: MongoMemoryServer;

let User: typeof import('../models/User.js').User;
let Category: typeof import('../models/Category.js').Category;
let Product: typeof import('../models/Product.js').Product;
let Cart: typeof import('../models/Cart.js').Cart;
let Order: typeof import('../models/Order.js').Order;

type TestAgent = ReturnType<typeof request.agent>;

const password = 'Password123!';

const seedStore = async () => {
  const createdCategories = await Category.create([
    {
      name: 'Bath & Body',
      slug: 'bath-body',
      image: 'https://example.com/bath.jpg',
    },
    {
      name: 'Home Rituals',
      slug: 'home-rituals',
      image: 'https://example.com/home.jpg',
    },
  ]);
  const bathCategory = createdCategories[0]!;
  const homeCategory = createdCategories[1]!;

  const createdProducts = await Product.create([
    {
      name: 'Cedar Hand Wash',
      slug: 'cedar-hand-wash',
      description:
        'A grounding botanical wash with cedarwood, bergamot, and mandarin peel for sinkside rituals.',
      price: 34,
      images: [{ url: 'https://example.com/cedar.jpg', alt: 'Cedar wash' }],
      category: bathCategory._id,
      stock: 10,
      ratings: { average: 4.8, count: 0 },
      reviews: [],
      sku: 'DM-HW-001',
      tags: ['botanical'],
      ecoBadge: 'Refill Friendly',
      isActive: true,
    },
    {
      name: 'Santal Room Mist',
      slug: 'santal-room-mist',
      description:
        'A warm room mist layered with sandalwood, vetiver, and citrus peel for quiet evenings.',
      price: 46,
      images: [{ url: 'https://example.com/mist.jpg', alt: 'Room mist' }],
      category: homeCategory._id,
      stock: 6,
      ratings: { average: 4.6, count: 0 },
      reviews: [],
      sku: 'DM-RM-002',
      tags: ['home'],
      ecoBadge: 'Low Waste',
      isActive: true,
    },
  ]);
  const cedarWash = createdProducts[0]!;
  const roomMist = createdProducts[1]!;

  const passwordHash = await bcrypt.hash(password, 12);

  const createdUsers = await User.create([
    {
      name: 'Admin User',
      email: 'admin@example.com',
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
  const adminUser = createdUsers[0]!;
  const customerUser = createdUsers[1]!;

  return {
    adminUser,
    customerUser,
    products: {
      cedarWash,
      roomMist,
    },
  };
};

const login = async (
  agent: TestAgent,
  email: string,
  loginPassword: string,
  guestCart?: Array<{ productId: string; quantity: number }>,
) =>
  agent.post('/api/auth/login').send({
    email,
    password: loginPassword,
    guestCart,
  });

const createOrderForCustomer = async (customerAgent: TestAgent, productId: string) => {
  const addToCartResponse = await customerAgent.post('/api/cart/add').send({
    productId,
    quantity: 2,
  });

  assert.equal(addToCartResponse.status, 201);

  const orderResponse = await customerAgent.post('/api/orders').send({
    shippingAddress: {
      label: ' Home ',
      fullName: ' Sample Customer ',
      line1: ' 123 Palm Street ',
      city: ' Los Angeles ',
      state: ' CA ',
      postalCode: ' 90001 ',
      country: ' USA ',
      phone: ' +1 555 0100 ',
    },
    note: ' leave near door ',
  });

  assert.equal(orderResponse.status, 201);

  return orderResponse;
};

describe('API integration', () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234567890';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234567890';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.EMAIL_FROM = 'Desert Modern <no-reply@example.com>';
    process.env.STRIPE_SECRET_KEY = '';
    process.env.STRIPE_WEBHOOK_SECRET = '';
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '2525';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    process.env.CLOUDINARY_CLOUD_NAME = '';
    process.env.CLOUDINARY_API_KEY = '';
    process.env.CLOUDINARY_API_SECRET = '';

    const [{ app: importedApp }, { connectDatabase }, userModule, categoryModule, productModule, cartModule, orderModule] =
      await Promise.all([
        import('../app.js'),
        import('../config/db.js'),
        import('../models/User.js'),
        import('../models/Category.js'),
        import('../models/Product.js'),
        import('../models/Cart.js'),
        import('../models/Order.js'),
      ]);

    app = importedApp;
    User = userModule.User;
    Category = categoryModule.Category;
    Product = productModule.Product;
    Cart = cartModule.Cart;
    Order = orderModule.Order;

    await connectDatabase();
  });

  beforeEach(async () => {
    await Promise.all([
      Order.deleteMany({}),
      Cart.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('covers public catalog, auth, password reset, and profile endpoints', async () => {
    const { products } = await seedStore();
    const agent = request.agent(app);

    const healthResponse = await agent.get('/api/health');
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(healthResponse.body, { status: 'ok' });

    const categoriesResponse = await agent.get('/api/categories');
    assert.equal(categoriesResponse.status, 200);
    assert.equal(categoriesResponse.body.categories.length, 2);

    const productsResponse = await agent.get('/api/products');
    assert.equal(productsResponse.status, 200);
    assert.equal(productsResponse.body.products.length, 2);

    const productDetailResponse = await agent.get(`/api/products/${products.cedarWash._id}`);
    assert.equal(productDetailResponse.status, 200);
    assert.equal(productDetailResponse.body.product.name, 'Cedar Hand Wash');

    const registerResponse = await agent.post('/api/auth/register').send({
      name: '  New Customer  ',
      email: '  new@example.com  ',
      password,
    });

    assert.equal(registerResponse.status, 201);
    assert.equal(registerResponse.body.requiresEmailVerification, false);

    const duplicateRegisterResponse = await agent.post('/api/auth/register').send({
      name: 'New Customer',
      email: 'new@example.com',
      password,
    });

    assert.equal(duplicateRegisterResponse.status, 409);

    const loginResponse = await login(agent, ' new@example.com ', password, [
      {
        productId: products.cedarWash._id.toString(),
        quantity: 2,
      },
    ]);

    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.user.email, 'new@example.com');
    assert.equal(loginResponse.body.user.name, 'New Customer');
    assert.equal(loginResponse.body.cart.itemCount, 2);

    const meResponse = await agent.get('/api/auth/me');
    assert.equal(meResponse.status, 200);
    assert.equal(meResponse.body.user.email, 'new@example.com');

    const refreshResponse = await agent.post('/api/auth/refresh');
    assert.equal(refreshResponse.status, 200);
    assert.equal(refreshResponse.body.user.email, 'new@example.com');

    const forgotPasswordResponse = await agent.post('/api/auth/forgot-password').send({
      email: ' new@example.com ',
    });

    assert.equal(forgotPasswordResponse.status, 200);
    assert.match(
      forgotPasswordResponse.body.resetUrl as string,
      /\/reset-password\//,
    );

    const token = (forgotPasswordResponse.body.resetUrl as string).split('/').pop();
    assert.ok(token);

    const resetPasswordResponse = await agent.post('/api/auth/reset-password').send({
      token,
      password: 'Updated123!',
    });

    assert.equal(resetPasswordResponse.status, 200);

    const oldPasswordLoginResponse = await login(
      request.agent(app),
      'new@example.com',
      password,
    );
    assert.equal(oldPasswordLoginResponse.status, 401);

    const nextAgent = request.agent(app);
    const nextLoginResponse = await login(nextAgent, 'new@example.com', 'Updated123!');
    assert.equal(nextLoginResponse.status, 200);

    const updateProfileResponse = await nextAgent.put('/api/users/me').send({
      name: '  Updated Customer  ',
      avatar: {
        url: 'https://example.com/avatar.jpg',
      },
    });

    assert.equal(updateProfileResponse.status, 200);
    assert.equal(updateProfileResponse.body.user.name, 'Updated Customer');
    assert.equal(
      updateProfileResponse.body.user.avatar.url,
      'https://example.com/avatar.jpg',
    );

    const addAddressResponse = await nextAgent.post('/api/users/me/addresses').send({
      label: ' Office ',
      fullName: ' Updated Customer ',
      line1: ' 456 Desert Road ',
      city: ' Austin ',
      state: ' TX ',
      postalCode: ' 73301 ',
      country: ' USA ',
      phone: ' +1 555 0111 ',
      isDefault: true,
    });

    assert.equal(addAddressResponse.status, 201);
    assert.equal(addAddressResponse.body.user.addresses.length, 1);
    assert.equal(addAddressResponse.body.user.addresses[0].label, 'Office');
    assert.equal(addAddressResponse.body.user.addresses[0].isDefault, true);

    const addressId = addAddressResponse.body.user.addresses[0]._id as string;

    const updateAddressResponse = await nextAgent
      .put(`/api/users/me/addresses/${addressId}`)
      .send({
        label: ' Home Base ',
        fullName: ' Updated Customer ',
        line1: ' 789 Sunset Ave ',
        line2: ' Suite 4 ',
        city: ' Phoenix ',
        state: ' AZ ',
        postalCode: ' 85001 ',
        country: ' USA ',
        phone: ' +1 555 0222 ',
        isDefault: true,
      });

    assert.equal(updateAddressResponse.status, 200);
    assert.equal(updateAddressResponse.body.user.addresses[0].label, 'Home Base');
    assert.equal(updateAddressResponse.body.user.addresses[0].line2, 'Suite 4');

    const removeAddressResponse = await nextAgent.delete(
      `/api/users/me/addresses/${addressId}`,
    );
    assert.equal(removeAddressResponse.status, 200);
    assert.equal(removeAddressResponse.body.user.addresses.length, 0);

    const logoutResponse = await nextAgent.post('/api/auth/logout');
    assert.equal(logoutResponse.status, 200);
  });

  it('covers cart, review, checkout, order confirmation, and webhook fallback', async () => {
    const { products } = await seedStore();
    const customerAgent = request.agent(app);

    const loginResponse = await login(customerAgent, 'customer@example.com', password);
    assert.equal(loginResponse.status, 200);

    const emptyCartResponse = await customerAgent.get('/api/cart');
    assert.equal(emptyCartResponse.status, 200);
    assert.equal(emptyCartResponse.body.cart.itemCount, 0);

    const addToCartResponse = await customerAgent.post('/api/cart/add').send({
      productId: products.cedarWash._id.toString(),
      quantity: 2,
    });
    assert.equal(addToCartResponse.status, 201);
    assert.equal(addToCartResponse.body.cart.itemCount, 2);

    const firstCartItemId = addToCartResponse.body.cart.items[0].id as string;

    const updateCartResponse = await customerAgent
      .put(`/api/cart/update/${firstCartItemId}`)
      .send({ quantity: 3 });
    assert.equal(updateCartResponse.status, 200);
    assert.equal(updateCartResponse.body.cart.items[0].quantity, 3);

    const addSecondProductResponse = await customerAgent.post('/api/cart/add').send({
      productId: products.roomMist._id.toString(),
      quantity: 1,
    });
    assert.equal(addSecondProductResponse.status, 201);
    assert.equal(addSecondProductResponse.body.cart.itemCount, 4);

    const secondCartItemId = addSecondProductResponse.body.cart.items.find(
      (item: { product: { id: string } }) =>
        item.product.id === products.roomMist._id.toString(),
    )?.id;
    assert.ok(secondCartItemId);

    const removeCartItemResponse = await customerAgent.delete(
      `/api/cart/remove/${secondCartItemId}`,
    );
    assert.equal(removeCartItemResponse.status, 200);
    assert.equal(removeCartItemResponse.body.cart.itemCount, 3);

    const reviewResponse = await customerAgent
      .post(`/api/products/${products.cedarWash._id}/reviews`)
      .send({
        rating: 5,
        comment: 'Excellent daily staple.',
      });
    assert.equal(reviewResponse.status, 201);

    const reviewedProductResponse = await customerAgent.get(
      `/api/products/${products.cedarWash._id}`,
    );
    assert.equal(reviewedProductResponse.status, 200);
    assert.equal(reviewedProductResponse.body.product.reviews.length, 1);

    const orderResponse = await customerAgent.post('/api/orders').send({
      shippingAddress: {
        label: ' Home ',
        fullName: ' Sample Customer ',
        line1: ' 123 Palm Street ',
        city: ' Los Angeles ',
        state: ' CA ',
        postalCode: ' 90001 ',
        country: ' USA ',
        phone: ' +1 555 0100 ',
      },
      note: ' leave near door ',
    });

    assert.equal(orderResponse.status, 201);
    assert.equal(orderResponse.body.simulated, true);
    assert.equal(orderResponse.body.checkoutUrl, null);
    assert.equal(orderResponse.body.order.paymentStatus, 'paid');
    assert.equal(orderResponse.body.order.status, 'processing');
    assert.equal(orderResponse.body.order.shippingAddress.label, 'Home');
    assert.equal(orderResponse.body.order.note, 'leave near door');

    const cartAfterOrderResponse = await customerAgent.get('/api/cart');
    assert.equal(cartAfterOrderResponse.status, 200);
    assert.equal(cartAfterOrderResponse.body.cart.itemCount, 0);

    const myOrdersResponse = await customerAgent.get('/api/orders/my-orders');
    assert.equal(myOrdersResponse.status, 200);
    assert.equal(myOrdersResponse.body.orders.length, 1);
    assert.equal(myOrdersResponse.body.orders[0].paymentStatus, 'paid');

    const confirmOrderResponse = await customerAgent.get(
      '/api/orders/confirm?sessionId=local-session',
    );
    assert.equal(confirmOrderResponse.status, 200);
    assert.equal(confirmOrderResponse.body.order.paymentStatus, 'paid');

    const updatedProduct = await Product.findById(products.cedarWash._id).lean();
    assert.equal(updatedProduct?.stock, 7);

    const webhookResponse = await request(app)
      .post('/api/orders/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify({ id: 'evt_test' })));
    assert.equal(webhookResponse.status, 200);
    assert.deepEqual(webhookResponse.body, { received: true });
  });

  it('covers admin analytics, order management, user moderation, product CRUD, and uploads', async () => {
    const { customerUser, products } = await seedStore();

    const customerAgent = request.agent(app);
    const customerLoginResponse = await login(
      customerAgent,
      'customer@example.com',
      password,
    );
    assert.equal(customerLoginResponse.status, 200);

    const paidOrderResponse = await createOrderForCustomer(
      customerAgent,
      products.cedarWash._id.toString(),
    );
    const orderId = paidOrderResponse.body.order._id as string;

    const adminAgent = request.agent(app);
    const adminLoginResponse = await login(adminAgent, 'admin@example.com', password);
    assert.equal(adminLoginResponse.status, 200);

    const adminOrdersResponse = await adminAgent.get('/api/orders');
    assert.equal(adminOrdersResponse.status, 200);
    assert.equal(adminOrdersResponse.body.orders.length, 1);

    const analyticsResponse = await adminAgent.get('/api/admin/analytics');
    assert.equal(analyticsResponse.status, 200);
    assert.equal(analyticsResponse.body.stats.totalOrders, 1);
    assert.equal(analyticsResponse.body.stats.totalUsers, 2);
    assert.equal(analyticsResponse.body.stats.revenue, paidOrderResponse.body.order.totalAmount);

    const updateOrderStatusResponse = await adminAgent
      .put(`/api/orders/${orderId}/status`)
      .send({ status: 'shipped' });
    assert.equal(updateOrderStatusResponse.status, 200);
    assert.equal(updateOrderStatusResponse.body.order.status, 'shipped');

    const usersResponse = await adminAgent.get('/api/admin/users');
    assert.equal(usersResponse.status, 200);
    assert.equal(usersResponse.body.users.length, 2);

    const banResponse = await adminAgent
      .patch(`/api/admin/users/${customerUser._id}/ban`)
      .send({ isBanned: true });
    assert.equal(banResponse.status, 200);
    assert.equal(banResponse.body.user.isBanned, true);

    const bannedLoginResponse = await login(
      request.agent(app),
      'customer@example.com',
      password,
    );
    assert.equal(bannedLoginResponse.status, 403);

    const createProductResponse = await adminAgent.post('/api/products').send({
      name: 'Amber Candle',
      description:
        'A grounding candle layered with cedarwood and bergamot for evening routines at home.',
      price: 48,
      images: [{ url: 'https://example.com/candle.jpg', alt: 'Amber candle' }],
      category: (await Category.findOne({ slug: 'home-rituals' }).lean())?._id.toString(),
      stock: 12,
      sku: 'DM-CN-004',
      tags: ['home', 'fragrance'],
      ecoBadge: 'Refill Friendly',
      isActive: true,
    });
    assert.equal(createProductResponse.status, 201);

    const createdProductId = createProductResponse.body.product._id as string;

    const updateProductResponse = await adminAgent.put(`/api/products/${createdProductId}`).send({
      stock: 8,
      price: 52,
    });
    assert.equal(updateProductResponse.status, 200);
    assert.equal(updateProductResponse.body.product.stock, 8);
    assert.equal(updateProductResponse.body.product.price, 52);

    const deleteProductResponse = await adminAgent.delete(`/api/products/${createdProductId}`);
    assert.equal(deleteProductResponse.status, 200);

    const invalidUploadResponse = await adminAgent
      .post('/api/uploads/image')
      .attach('image', Buffer.from('not-an-image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    assert.equal(invalidUploadResponse.status, 400);

    const missingCloudinaryResponse = await adminAgent
      .post('/api/uploads/image')
      .attach('image', Buffer.from('fake-image'), {
        filename: 'sample.png',
        contentType: 'image/png',
      });
    assert.equal(missingCloudinaryResponse.status, 503);
  });
});
