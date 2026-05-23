/**
 * Integration Tests for Security Features
 */

const request = require('supertest');
const express = require('express');

// Mock the server setup
const mockApp = () => {
  const app = express();
  app.use(express.json());
  
  // Import middleware
  const { correlationId } = require('../../server/middleware/correlationId');
  const { prototypePollutionProtection } = require('../../server/middleware/sanitize');
  const { sanitizeProductBody, sanitizeReviewBody } = require('../../server/middleware/sanitizeMiddleware');
  const { reviewStrictLimiter } = require('../../server/middleware/rateLimiters');
  const { validate } = require('../../server/validation');
  
  // Apply middleware
  app.use(correlationId);
  app.use(prototypePollutionProtection);
  
  // Mock endpoints
  app.post('/api/products', sanitizeProductBody, (req, res) => {
    res.json({ success: true, product: req.body.product });
  });
  
  app.post('/api/reviews', reviewStrictLimiter, sanitizeReviewBody, (req, res) => {
    res.json({ success: true, review: req.body.review });
  });
  
  app.post('/api/test-pollution', (req, res) => {
    res.json({ body: req.body });
  });
  
  return app;
};

describe('Security Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = mockApp();
  });

  describe('Correlation ID', () => {
    test('should add correlation ID to response headers', async () => {
      const response = await request(app)
        .get('/api/test-pollution')
        .expect(404); // 404 is expected for non-existent route
      
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toMatch(/^[a-f0-9]{32}$/);
    });

    test('should use existing correlation ID from request', async () => {
      const existingId = 'test-correlation-id-123';
      
      const response = await request(app)
        .get('/api/test-pollution')
        .set('x-correlation-id', existingId)
        .expect(404);
      
      expect(response.headers['x-correlation-id']).toBe(existingId);
    });
  });

  describe('Prototype Pollution Protection', () => {
    test('should prevent prototype pollution via __proto__', async () => {
      const maliciousPayload = {
        __proto__: { polluted: true },
        normal: 'value'
      };

      const response = await request(app)
        .post('/api/test-pollution')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.__proto__).toBeUndefined();
      expect(response.body.body.normal).toBe('value');
    });

    test('should prevent prototype pollution via constructor', async () => {
      const maliciousPayload = {
        constructor: { prototype: { polluted: true } },
        normal: 'value'
      };

      const response = await request(app)
        .post('/api/test-pollution')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.body.constructor).toBeUndefined();
      expect(response.body.body.normal).toBe('value');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize product data and prevent XSS', async () => {
      const maliciousProduct = {
        product: {
          name: '<script>alert("xss")</script>Product Name',
          description: '<p onclick="alert(1)">Description</p>',
          price: '99.99'
        }
      };

      const response = await request(app)
        .post('/api/products')
        .send(maliciousProduct)
        .expect(200);

      expect(response.body.product.name).not.toContain('<script>');
      expect(response.body.product.description).not.toContain('onclick');
      expect(response.body.product.name).toContain('Product Name');
    });

    test('should sanitize review data and prevent XSS', async () => {
      const maliciousReview = {
        review: {
          title: '<script>alert("xss")</script>Great Product',
          content: 'Review with <img src=x onerror=alert(1)>',
          rating: '5',
          userEmail: 'user@example.com',
          userName: 'User<script>alert(1)</script>Name'
        }
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(maliciousReview)
        .expect(200);

      expect(response.body.review.title).not.toContain('<script>');
      expect(response.body.review.content).not.toContain('onerror');
      expect(response.body.review.userName).not.toContain('<script>');
      expect(response.body.review.title).toContain('Great Product');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on review endpoint', async () => {
      const reviewData = {
        review: {
          title: 'Test Review',
          content: 'Test content',
          rating: 5,
          userEmail: 'user@example.com',
          userName: 'Test User'
        }
      };

      // Make requests up to the limit (5 per day)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/reviews')
          .send(reviewData)
          .expect(200);
      }

      // 6th request should be rate limited
      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData)
        .expect(429);

      expect(response.body.error).toContain('Bạn đã đánh giá quá nhiều');
      expect(response.body.code).toBe('RATE_LIMIT_REVIEW');
    });
  });

  describe('Combined Security Features', () => {
    test('should apply all security measures together', async () => {
      const maliciousPayload = {
        __proto__: { polluted: true },
        product: {
          name: '<script>alert("xss")</script>Product',
          description: '<img src=x onerror=alert(1)>Description',
          price: '99.99'
        }
      };

      const response = await request(app)
        .post('/api/products')
        .send(maliciousPayload)
        .expect(200);

      // Check correlation ID
      expect(response.headers['x-correlation-id']).toBeDefined();

      // Check prototype pollution protection
      expect(response.body.__proto__).toBeUndefined();

      // Check input sanitization
      expect(response.body.product.name).not.toContain('<script>');
      expect(response.body.product.description).not.toContain('onerror');
      expect(response.body.product.name).toContain('Product');
    });
  });

  describe('Error Handling', () => {
    test('should include correlation ID in error responses', async () => {
      const response = await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });
});