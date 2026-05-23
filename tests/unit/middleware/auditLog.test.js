/**
 * Unit Tests for Audit Logging Middleware
 */

const {
  createAuditLog,
  saveAuditLog,
  auditLog,
  AUDIT_EVENTS
} = require('../../../server/middleware/auditLog');

describe('Audit Logging Middleware', () => {
  
  describe('createAuditLog', () => {
    test('should create audit log entry with all fields', () => {
      const params = {
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        userId: 'user123',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        action: 'POST /api/products',
        resource: 'product',
        resourceId: 'prod123',
        changes: { after: { name: 'New Product' } },
        metadata: { method: 'POST' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success'
      };

      const entry = createAuditLog(params);

      expect(entry.event).toBe(AUDIT_EVENTS.PRODUCT_CREATE);
      expect(entry.user.id).toBe('user123');
      expect(entry.user.email).toBe('admin@example.com');
      expect(entry.user.role).toBe('admin');
      expect(entry.action).toBe('POST /api/products');
      expect(entry.resource.type).toBe('product');
      expect(entry.resource.id).toBe('prod123');
      expect(entry.changes).toEqual({ after: { name: 'New Product' } });
      expect(entry.request.ipAddress).toBe('192.168.1.1');
      expect(entry.request.userAgent).toBe('Mozilla/5.0');
      expect(entry.status).toBe('success');
      expect(entry.timestamp).toBeDefined();
    });

    test('should use default values for optional fields', () => {
      const params = {
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        userId: 'user123',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        action: 'POST /api/products',
        resource: 'product',
        resourceId: 'prod123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      const entry = createAuditLog(params);

      expect(entry.changes).toBeNull();
      expect(entry.metadata).toEqual({});
      expect(entry.status).toBe('success');
      expect(entry.errorMessage).toBeNull();
    });
  });

  describe('saveAuditLog', () => {
    test('should save audit log to database', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          add: jest.fn().mockResolvedValue({ id: 'log123' })
        })
      };

      const entry = {
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        timestamp: new Date().toISOString(),
        user: { id: 'user123' }
      };

      await saveAuditLog(mockDb, entry);

      expect(mockDb.collection).toHaveBeenCalledWith('audit_logs');
      expect(mockDb.collection().add).toHaveBeenCalledWith(entry);
    });

    test('should handle database unavailable gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const entry = {
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        timestamp: new Date().toISOString()
      };

      // Should not throw error when adminDb is null
      await expect(saveAuditLog(null, entry)).resolves.toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    test('should handle database errors gracefully', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          add: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const entry = {
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        timestamp: new Date().toISOString()
      };

      // Should not throw error when database fails
      await expect(saveAuditLog(mockDb, entry)).resolves.toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('auditLog middleware', () => {
    test('should create middleware function', () => {
      const middleware = auditLog({
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        resource: 'product'
      });

      expect(typeof middleware).toBe('function');
    });

    test('should intercept response and log audit entry', async () => {
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          add: jest.fn().mockResolvedValue({ id: 'log123' })
        })
      };

      const req = {
        user: {
          userId: 'user123',
          email: 'admin@example.com',
          role: 'admin'
        },
        method: 'POST',
        path: '/api/products',
        params: { id: 'prod123' },
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        app: {
          locals: { adminDb: mockDb }
        }
      };

      const res = {
        json: jest.fn(),
        statusCode: 200
      };

      const next = jest.fn();

      const middleware = auditLog({
        event: AUDIT_EVENTS.PRODUCT_CREATE,
        resource: 'product',
        getResourceId: (req) => req.params.id
      });

      middleware(req, res, next);

      // Simulate response
      res.json({ success: true });

      expect(next).toHaveBeenCalled();
      
      // Wait for async audit log save
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDb.collection).toHaveBeenCalledWith('audit_logs');
    });
  });
});