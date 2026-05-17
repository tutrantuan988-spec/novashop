/**
 * Unit Tests for Rate Limiting Middleware
 */

const request = require('supertest');
const express = require('express');
const {
  authStrictLimiter,
  adminStrictLimiter,
  paymentLimiter,
  contactStrictLimiter,
  reviewStrictLimiter
} = require('../../../server/middleware/rateLimiters');

describe('Rate Limiting Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('authStrictLimiter', () => {
    beforeEach(() => {
      app.use('/auth', authStrictLimiter);
      app.post('/auth/login', (req, res) => res.json({ success: true }));
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/auth/login')
          .expect(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('should block requests exceeding limit', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/auth/login').expect(200);
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/auth/login')
        .expect(429);
      
      expect(response.body.error).toContain('Quá nhiều lần đăng nhập');
      expect(response.body.code).toBe('RATE_LIMIT_AUTH');
    });
  });

  describe('adminStrictLimiter', () => {
    beforeEach(() => {
      app.use('/admin', adminStrictLimiter);
      app.post('/admin/action', (req, res) => res.json({ success: true }));
    });

    test('should allow admin requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/admin/action')
          .expect(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('should block admin requests exceeding limit', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/admin/action').expect(200);
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/admin/action')
        .expect(429);
      
      expect(response.body.error).toContain('Quá nhiều thao tác admin');
      expect(response.body.code).toBe('RATE_LIMIT_ADMIN');
    });
  });

  describe('paymentLimiter', () => {
    beforeEach(() => {
      app.use('/payment', paymentLimiter);
      app.post('/payment/create', (req, res) => res.json({ success: true }));
    });

    test('should allow payment requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/payment/create')
          .expect(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('should block payment requests exceeding limit', async () => {
      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await request(app).post('/payment/create').expect(200);
      }

      // 11th request should be blocked
      const response = await request(app)
        .post('/payment/create')
        .expect(429);
      
      expect(response.body.error).toContain('Quá nhiều giao dịch');
      expect(response.body.code).toBe('RATE_LIMIT_PAYMENT');
    });
  });

  describe('contactStrictLimiter', () => {
    beforeEach(() => {
      app.use('/contact', contactStrictLimiter);
      app.post('/contact/send', (req, res) => res.json({ success: true }));
    });

    test('should allow contact requests within limit', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/contact/send')
          .expect(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('should block contact requests exceeding limit', async () => {
      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        await request(app).post('/contact/send').expect(200);
      }

      // 4th request should be blocked
      const response = await request(app)
        .post('/contact/send')
        .expect(429);
      
      expect(response.body.error).toContain('Bạn đã gửi quá nhiều tin nhắn');
      expect(response.body.code).toBe('RATE_LIMIT_CONTACT');
    });
  });

  describe('reviewStrictLimiter', () => {
    beforeEach(() => {
      app.use('/review', reviewStrictLimiter);
      app.post('/review/submit', (req, res) => res.json({ success: true }));
    });

    test('should allow review requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/review/submit')
          .expect(200);
        expect(response.body.success).toBe(true);
      }
    });

    test('should block review requests exceeding limit', async () => {
      // Make 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/review/submit').expect(200);
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/review/submit')
        .expect(429);
      
      expect(response.body.error).toContain('Bạn đã đánh giá quá nhiều');
      expect(response.body.code).toBe('RATE_LIMIT_REVIEW');
    });
  });
});