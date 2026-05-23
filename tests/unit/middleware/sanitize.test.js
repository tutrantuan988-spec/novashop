/**
 * Unit Tests for Input Sanitization Middleware
 */

const {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeProduct,
  sanitizeOrder,
  sanitizeReview,
  prototypePollutionProtection
} = require('../../../server/middleware/sanitize');

describe('Input Sanitization Middleware', () => {
  
  describe('sanitizeHtml', () => {
    test('should remove dangerous script tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    test('should remove dangerous attributes', () => {
      const input = '<p onclick="alert(1)">Content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>Content</p>');
    });

    test('should allow safe HTML tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
  });

  describe('sanitizeText', () => {
    test('should remove all HTML tags', () => {
      const input = '<p>Hello <script>alert(1)</script> World</p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello  World');
    });

    test('should remove control characters', () => {
      const input = 'Hello\x00\x01World';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorld');
    });

    test('should limit length', () => {
      const input = 'a'.repeat(3000);
      const result = sanitizeText(input);
      expect(result.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('sanitizeEmail', () => {
    test('should validate and clean email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('valid@email.com')).toBe('valid@email.com');
    });

    test('should reject invalid emails', () => {
      expect(sanitizeEmail('invalid-email')).toBeNull();
      expect(sanitizeEmail('test@')).toBeNull();
      expect(sanitizeEmail('@example.com')).toBeNull();
    });
  });

  describe('sanitizePhone', () => {
    test('should clean phone numbers', () => {
      expect(sanitizePhone('+84 123-456-789')).toBe('+84123456789');
      expect(sanitizePhone('(123) 456-7890')).toBe('1234567890');
    });

    test('should handle plus sign correctly', () => {
      expect(sanitizePhone('+1+2+3')).toBe('+123');
    });
  });

  describe('sanitizeUrl', () => {
    test('should validate HTTP/HTTPS URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://test.com/path')).toBe('http://test.com/path');
    });

    test('should reject non-HTTP protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>')).toBeNull();
    });
  });

  describe('sanitizeNumber', () => {
    test('should validate and constrain numbers', () => {
      expect(sanitizeNumber('123')).toBe(123);
      expect(sanitizeNumber('abc', { default: 0 })).toBe(0);
      expect(sanitizeNumber(150, { min: 0, max: 100 })).toBe(100);
      expect(sanitizeNumber(-10, { min: 0 })).toBe(0);
    });
  });

  describe('sanitizeProduct', () => {
    test('should sanitize product data', () => {
      const input = {
        name: '<script>alert(1)</script>Product Name',
        description: '<p onclick="alert(1)">Description</p>',
        price: '99.99',
        stock: '10',
        image: 'https://example.com/image.jpg'
      };

      const result = sanitizeProduct(input);
      
      expect(result.name).not.toContain('<script>');
      expect(result.description).not.toContain('onclick');
      expect(result.price).toBe(99.99);
      expect(result.stock).toBe(10);
      expect(result.image).toBe('https://example.com/image.jpg');
    });
  });

  describe('sanitizeOrder', () => {
    test('should sanitize order data', () => {
      const input = {
        customer: {
          name: '<script>alert(1)</script>John Doe',
          email: '  JOHN@EXAMPLE.COM  ',
          phone: '+84 123-456-789',
          address: 'Address with <script>alert(1)</script>'
        },
        items: [
          { id: '1', name: 'Product', quantity: '2' }
        ],
        note: 'Order note with <script>alert(1)</script>'
      };

      const result = sanitizeOrder(input);
      
      expect(result.customer.name).not.toContain('<script>');
      expect(result.customer.email).toBe('john@example.com');
      expect(result.customer.phone).toBe('+84123456789');
      expect(result.customer.address).not.toContain('<script>');
      expect(result.items[0].quantity).toBe(2);
      expect(result.note).not.toContain('<script>');
    });
  });

  describe('sanitizeReview', () => {
    test('should sanitize review data', () => {
      const input = {
        rating: '5',
        title: '<script>alert(1)</script>Great Product',
        content: 'Review with <script>alert(1)</script>',
        userEmail: '  USER@EXAMPLE.COM  ',
        userName: 'User<script>alert(1)</script>Name'
      };

      const result = sanitizeReview(input);
      
      expect(result.rating).toBe(5);
      expect(result.title).not.toContain('<script>');
      expect(result.content).not.toContain('<script>');
      expect(result.userEmail).toBe('user@example.com');
      expect(result.userName).not.toContain('<script>');
    });
  });

  describe('prototypePollutionProtection', () => {
    test('should prevent prototype pollution', () => {
      const req = {
        body: {
          __proto__: { polluted: true },
          constructor: { prototype: { polluted: true } },
          normal: 'value'
        }
      };
      const res = {};
      const next = jest.fn();

      prototypePollutionProtection(req, res, next);

      expect(req.body.__proto__).toBeUndefined();
      expect(req.body.constructor).toBeUndefined();
      expect(req.body.normal).toBe('value');
      expect(next).toHaveBeenCalled();
    });
  });
});