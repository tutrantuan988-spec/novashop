const swaggerUi = require('swagger-ui-express');

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'NovaShop API',
    description: 'Backend API documentation for NovaShop luxury ecommerce.',
    version: '1.0.0',
    contact: { name: 'NovaShop Support', email: 'admin@novashop.vn' }
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local dev server' },
    { url: 'https://api.novashop.vn', description: 'Production' }
  ],
  tags: [
    { name: 'Health', description: 'Server health & connectivity' },
    { name: 'Admin', description: 'Admin authentication & config' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Products', description: 'Product catalog' },
    { name: 'Coupons', description: 'Discount codes' },
    { name: 'Reviews', description: 'Product reviews' },
    { name: 'Payments', description: 'Stripe, VNPay, MoMo' },
    { name: 'Analytics', description: 'Dashboard metrics' }
  ],
  components: {
    schemas: {
      Customer: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Nguyen Van A' },
          phone: { type: 'string', example: '0909123456' },
          email: { type: 'string', example: 'a@gmail.com' },
          address: { type: 'string', example: '123 Le Loi, Q1, TP.HCM' }
        },
        required: ['name', 'phone', 'address']
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1715601' },
          name: { type: 'string' },
          price: { type: 'number' },
          image: { type: 'string' },
          quantity: { type: 'integer', minimum: 1, example: 2 }
        },
        required: ['id', 'quantity']
      },
      Order: {
        type: 'object',
        properties: {
          customer: { $ref: '#/components/schemas/Customer' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          paymentMethod: { type: 'string', enum: ['cod', 'bank', 'momo', 'stripe', 'vnpay'], default: 'cod' },
          shipping: { type: 'number', default: 0 },
          coupon: { type: 'string' }
        },
        required: ['customer', 'items']
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'T-Shirt Premium' },
          price: { type: 'number', example: 450000 },
          originalPrice: { type: 'number' },
          category: { type: 'string' },
          image: { type: 'string' },
          gallery: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          stock: { type: 'integer', minimum: 0 },
          colors: { type: 'array', items: { type: 'string' } },
          sizes: { type: 'array', items: { type: 'string' } },
          featured: { type: 'boolean' },
          active: { type: 'boolean' }
        },
        required: ['name', 'price']
      },
      Coupon: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'SALE20' },
          type: { type: 'string', enum: ['percent', 'fixed', 'shipping'], default: 'percent' },
          value: { type: 'number', default: 0 },
          minSubtotal: { type: 'number', default: 0 },
          maxDiscount: { type: 'number', default: 0 },
          usageLimit: { type: 'integer', default: 0 },
          expiresAt: { type: 'string', format: 'date-time' },
          active: { type: 'boolean', default: true }
        },
        required: ['code']
      },
      Review: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          title: { type: 'string' },
          content: { type: 'string' },
          userEmail: { type: 'string', format: 'email' },
          userName: { type: 'string' }
        },
        required: ['rating', 'userEmail', 'userName']
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          issues: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    securitySchemes: {
      AdminToken: {
        type: 'apiKey',
        in: 'header',
        name: 'authorization',
        description: 'Bearer ADMIN_API_TOKEN'
      },
      AdminEmail: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-email',
        description: 'Admin email (must be in ADMIN_EMAILS)'
      }
    }
  },
  security: [{ AdminEmail: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Server health check',
        description: 'Returns connectivity status of Stripe, Firestore, and Email.',
        responses: {
          '200': {
            description: 'Healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number' },
                    checks: {
                      type: 'object',
                      properties: {
                        stripe: { type: 'object', properties: { ok: { type: 'boolean' } } },
                        firestore: { type: 'object', properties: { ok: { type: 'boolean' } } },
                        email: { type: 'object', properties: { ok: { type: 'boolean' } } }
                      }
                    }
                  }
                }
              }
            }
          },
          '503': { description: 'Degraded — one or more services unavailable' }
        }
      }
    },
    '/api/admin/config': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin auth config',
        responses: {
          '200': {
            description: 'Config',
            content: { 'application/json': { schema: { type: 'object', properties: { tokenRequired: { type: 'boolean' }, tokenConfigured: { type: 'boolean' } } } } }
          }
        }
      }
    },
    '/api/admin/verify': {
      get: {
        tags: ['Admin'],
        summary: 'Verify admin credentials',
        security: [{ AdminToken: [], AdminEmail: [] }],
        responses: {
          '200': { description: 'Verified' },
          '403': { description: 'Forbidden' }
        }
      }
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a new order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { order: { $ref: '#/components/schemas/Order' } } }
            }
          }
        },
        responses: {
          '200': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' }, total: { type: 'number' } } }
              }
            }
          },
          '400': { description: 'Validation error' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] } } }
            }
          }
        },
        responses: {
          '200': { description: 'Updated' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/orders/{id}/shipping': {
      patch: {
        tags: ['Orders'],
        summary: 'Update shipping info',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shippingInfo: {
                    type: 'object',
                    properties: {
                      carrier: { type: 'string' },
                      trackingCode: { type: 'string' },
                      estimatedDelivery: { type: 'string' },
                      note: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Updated' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/orders/{id}/summary': {
      get: {
        tags: ['Orders'],
        summary: 'Get order summary',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Summary' },
          '404': { description: 'Not found' }
        }
      }
    },
    '/api/orders/mine': {
      get: {
        tags: ['Orders'],
        summary: 'List orders by customer email',
        parameters: [{ in: 'query', name: 'email', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Orders list' }
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List all products',
        responses: {
          '200': {
            description: 'Products array',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } }
          }
        }
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product',
        security: [{ AdminToken: [], AdminEmail: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { product: { $ref: '#/components/schemas/Product' } } } } }
        },
        responses: {
          '200': { description: 'Created' },
          '400': { description: 'Validation error' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/products/{id}': {
      patch: {
        tags: ['Products'],
        summary: 'Update a product',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { patch: { type: 'object' } } } } }
        },
        responses: {
          '200': { description: 'Updated' },
          '403': { description: 'Not admin' }
        }
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/coupons': {
      get: {
        tags: ['Coupons'],
        summary: 'List coupons',
        security: [{ AdminToken: [], AdminEmail: [] }],
        responses: {
          '200': { description: 'Coupons list' },
          '403': { description: 'Not admin' }
        }
      },
      post: {
        tags: ['Coupons'],
        summary: 'Create a coupon',
        security: [{ AdminToken: [], AdminEmail: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { coupon: { $ref: '#/components/schemas/Coupon' } } } } }
        },
        responses: {
          '200': { description: 'Created' },
          '400': { description: 'Validation error' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/coupons/{code}': {
      patch: {
        tags: ['Coupons'],
        summary: 'Update a coupon',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'code', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { patch: { type: 'object' } } } } }
        },
        responses: {
          '200': { description: 'Updated' },
          '403': { description: 'Not admin' }
        }
      },
      delete: {
        tags: ['Coupons'],
        summary: 'Delete a coupon',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'path', name: 'code', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/coupons/validate': {
      post: {
        tags: ['Coupons'],
        summary: 'Validate a coupon',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { code: { type: 'string' }, subtotal: { type: 'number' } } }
            }
          }
        },
        responses: {
          '200': { description: 'Valid coupon' },
          '400': { description: 'Invalid coupon' }
        }
      }
    },
    '/api/products/{id}/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List product reviews',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Reviews array' }
        }
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create a review',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { review: { $ref: '#/components/schemas/Review' } } } } }
        },
        responses: {
          '200': { description: 'Created' },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/api/products/{id}/reviews/{reviewId}': {
      delete: {
        tags: ['Reviews'],
        summary: 'Delete a review',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'reviewId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Deleted' },
          '403': { description: 'Not admin' }
        }
      }
    },
    '/api/create-checkout-session': {
      post: {
        tags: ['Payments'],
        summary: 'Create Stripe checkout session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } }, orderId: { type: 'string' }, customerEmail: { type: 'string' } } }
            }
          }
        },
        responses: {
          '200': { description: 'Session created' },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/api/payments/vnpay/create': {
      post: {
        tags: ['Payments'],
        summary: 'Create VNPay payment URL',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { orderId: { type: 'string' } } } } }
        },
        responses: {
          '200': { description: 'Payment URL' },
          '500': { description: 'VNPay not configured' }
        }
      }
    },
    '/api/payments/momo/create': {
      post: {
        tags: ['Payments'],
        summary: 'Create MoMo payment URL',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { orderId: { type: 'string' }, amount: { type: 'number' }, returnUrl: { type: 'string' }, ipnUrl: { type: 'string' } } }
            }
          }
        },
        responses: {
          '200': { description: 'Payment URL & QR code' },
          '500': { description: 'MoMo not configured' }
        }
      }
    },
    '/api/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Dashboard analytics',
        security: [{ AdminToken: [], AdminEmail: [] }],
        parameters: [{ in: 'query', name: 'days', schema: { type: 'integer', default: 30 } }],
        responses: {
          '200': { description: 'Analytics data' },
          '403': { description: 'Not admin' }
        }
      }
    }
  }
};

function swaggerSetup(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'NovaShop API Docs',
    customCss: '.swagger-ui .topbar { display: none }'
  }));
}

module.exports = { swaggerSetup };
