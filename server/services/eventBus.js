const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const redisModule = require('./redis');
const publish = typeof redisModule.publish === 'function' ? redisModule.publish : async () => {};
const subscribe = typeof redisModule.subscribe === 'function' ? redisModule.subscribe : () => {};

// Local in-memory emitter (used by agents for intra-process messaging)
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(100);

/**
 * Event Bus for Microservices Communication
 * Implements pub/sub pattern for event-driven architecture
 */

const EVENT_CHANNELS = {
  ORDER_CREATED: 'events:order:created',
  ORDER_PAID: 'events:order:paid',
  ORDER_CANCELLED: 'events:order:cancelled',
  PRODUCT_CREATED: 'events:product:created',
  PRODUCT_UPDATED: 'events:product:updated',
  PRODUCT_DELETED: 'events:product:deleted',
  USER_REGISTERED: 'events:user:registered',
  SUBSCRIPTION_CHANGED: 'events:subscription:changed',
  EMAIL_SENT: 'events:email:sent',
  NOTIFICATION_CREATED: 'events:notification:created'
};

const eventHandlers = {};

function registerEventHandler(eventType, handler) {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = [];
  }
  eventHandlers[eventType].push(handler);
  logger.info(`[EventBus] Registered handler for ${eventType}`);
}

async function emit(eventType, data) {
  try {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      eventId: `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Local in-memory emit (synchronous, for intra-process listeners like agents)
    localEmitter.emit(eventType, data ?? event);

    // Publish to Redis for cross-service communication (only for known channels)
    if (EVENT_CHANNELS[eventType]) {
      await publish(EVENT_CHANNELS[eventType], event);
    }

    // Execute local handlers
    const handlers = eventHandlers[eventType] || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`[EventBus] Handler error for ${eventType}:`, error);
      }
    }

    logger.info(`[EventBus] Emitted event: ${eventType}`, { eventId: event.eventId });
    return { success: true, eventId: event.eventId };
  } catch (error) {
    logger.error('[EventBus] Emit error:', error);
    return { success: false, error: error.message };
  }
}

async function subscribeToEvents() {
  const redis = require('./redis');
  const initFn = typeof redis.initRedis === 'function' ? redis.initRedis : redis.getRedis;
  if (typeof initFn !== 'function') {
    logger.warn('[EventBus] Redis not available - event subscription disabled');
    return;
  }
  try {
    const ready = await initFn();
    if (!ready) {
      logger.warn('[EventBus] Redis not available - event subscription disabled');
      return;
    }
  } catch (err) {
    logger.warn('[EventBus] Redis init failed - event subscription disabled:', err.message);
    return;
  }

  // Subscribe to all event channels
  const channels = Object.values(EVENT_CHANNELS);
  
  for (const channel of channels) {
    subscribe(channel, async (event) => {
      try {
        logger.info(`[EventBus] Received event from ${channel}`, { eventType: event.type });
        
        // Execute handlers for this event type
        const handlers = eventHandlers[event.type] || [];
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            logger.error(`[EventBus] Handler error for ${event.type}:`, error);
          }
        }
      } catch (error) {
        logger.error('[EventBus] Event processing error:', error);
      }
    });
  }

  logger.info('[EventBus] Subscribed to all event channels');
}

// Event handlers for specific use cases
const orderHandlers = {
  async onOrderCreated(event) {
    logger.info('[OrderHandlers] Order created', { orderId: event.data.orderId });
    // Trigger: inventory reservation, email notification, analytics
  },
  
  async onOrderPaid(event) {
    logger.info('[OrderHandlers] Order paid', { orderId: event.data.orderId });
    // Trigger: fulfillment, email confirmation, subscription check
  },
  
  async onOrderCancelled(event) {
    logger.info('[OrderHandlers] Order cancelled', { orderId: event.data.orderId });
    // Trigger: inventory release, refund, notification
  }
};

const productHandlers = {
  async onProductCreated(event) {
    logger.info('[ProductHandlers] Product created', { productId: event.data.productId });
    // Trigger: search indexing, cache invalidation, notification
  },
  
  async onProductUpdated(event) {
    logger.info('[ProductHandlers] Product updated', { productId: event.data.productId });
    // Trigger: search reindexing, cache update
  },
  
  async onProductDeleted(event) {
    logger.info('[ProductHandlers] Product deleted', { productId: event.data.productId });
    // Trigger: search deletion, cache invalidation
  }
};

const subscriptionHandlers = {
  async onSubscriptionChanged(event) {
    logger.info('[SubscriptionHandlers] Subscription changed', { tenantId: event.data.tenantId });
    // Trigger: feature update, notification, billing sync
  }
};

// Register built-in handlers
registerEventHandler(EVENT_CHANNELS.ORDER_CREATED, orderHandlers.onOrderCreated);
registerEventHandler(EVENT_CHANNELS.ORDER_PAID, orderHandlers.onOrderPaid);
registerEventHandler(EVENT_CHANNELS.ORDER_CANCELLED, orderHandlers.onOrderCancelled);
registerEventHandler(EVENT_CHANNELS.PRODUCT_CREATED, productHandlers.onProductCreated);
registerEventHandler(EVENT_CHANNELS.PRODUCT_UPDATED, productHandlers.onProductUpdated);
registerEventHandler(EVENT_CHANNELS.PRODUCT_DELETED, productHandlers.onProductDeleted);
registerEventHandler(EVENT_CHANNELS.SUBSCRIPTION_CHANGED, subscriptionHandlers.onSubscriptionChanged);

module.exports = {
  EVENT_CHANNELS,
  emit,
  registerEventHandler,
  subscribeToEvents,
  orderHandlers,
  productHandlers,
  subscriptionHandlers,
  // EventEmitter API for in-memory listeners (used by agents)
  on: (event, handler) => localEmitter.on(event, handler),
  off: (event, handler) => localEmitter.off(event, handler),
  once: (event, handler) => localEmitter.once(event, handler),
  removeListener: (event, handler) => localEmitter.removeListener(event, handler)
};
