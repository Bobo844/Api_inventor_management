const request = require('supertest');
const app = require('../server');
const { User, Product, Order, Store } = require('../models');
const sequelize = require('../config/database');

let authToken;
let testUser;
let testProduct;
let testOrder;
let testStore;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Synchroniser la base de données de test
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          role: 'ADMIN'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('Store Management', () => {
    it('should create a new store', async () => {
      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Store',
          address: '123 Test Street',
          phone: '1234567890',
          email: 'store@test.com'
        });

      expect(res.statusCode).toBe(201);
      testStore = res.body;
    });

    it('should get all stores', async () => {
      const res = await request(app)
        .get('/api/stores')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('Product Management', () => {
    it('should create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          sku: 'TEST123',
          price: 99.99,
          currentStock: 100,
          minStockLevel: 10,
          storeId: testStore.id
        });

      expect(res.statusCode).toBe(201);
      testProduct = res.body;
    });

    it('should get all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('Order Management', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supplierId: 1,
          items: [
            {
              productId: testProduct.id,
              quantity: 5,
              unitPrice: 99.99
            }
          ],
          expectedDeliveryDate: new Date().toISOString(),
          notes: 'Test order'
        });

      expect(res.statusCode).toBe(201);
      testOrder = res.body;
    });

    it('should get all orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('Stock Management', () => {
    it('should update product stock', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 50,
          type: 'IN',
          reason: 'RESTOCK',
          notes: 'Test stock update'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.currentStock).toBe(150); // 100 + 50
    });
  });
}); 