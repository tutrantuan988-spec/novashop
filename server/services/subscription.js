const logger = require('../utils/logger');
const { SUBSCRIPTION_TIERS } = require('./tenant');

/**
 * Subscription billing service
 * Manages Stripe subscriptions for multi-tenant SaaS
 */

const SUBSCRIPTION_PRICES = {
  STARTER: {
    productId: 'prod_novashop_starter',
    priceId: 'price_novashop_starter_monthly',
    amount: 290000,
    currency: 'vnd',
    interval: 'month'
  },
  PROFESSIONAL: {
    productId: 'prod_novashop_professional',
    priceId: 'price_novashop_professional_monthly',
    amount: 890000,
    currency: 'vnd',
    interval: 'month'
  },
  ENTERPRISE: {
    productId: 'prod_novashop_enterprise',
    priceId: 'price_novashop_enterprise_monthly',
    amount: 2890000,
    currency: 'vnd',
    interval: 'month'
  }
};

async function createSubscriptionCheckout(tenantId, tier, stripe, adminDb) {
  try {
    const priceConfig = SUBSCRIPTION_PRICES[tier];
    if (!priceConfig) {
      throw new Error('Invalid subscription tier');
    }

    // Get tenant info
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      throw new Error('Tenant not found');
    }

    const tenant = tenantDoc.data();

    // Create Stripe customer if not exists
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.contactEmail,
        name: tenant.name,
        metadata: { tenantId }
      });
      customerId = customer.id;

      await adminDb.collection('tenants').doc(tenantId).update({
        stripeCustomerId: customerId
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceConfig.priceId,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        tenantId,
        tier
      },
      subscription_data: {
        metadata: {
          tenantId,
          tier
        }
      }
    });

    logger.info(`[Subscription] Created checkout for tenant ${tenantId}, tier ${tier}`);
    return { sessionId: session.id, url: session.url };
  } catch (error) {
    logger.error('[Subscription] Failed to create checkout:', error);
    throw error;
  }
}

async function handleSubscriptionWebhook(event, stripe, adminDb) {
  try {
    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const { tenantId, tier } = session.metadata;
        const customerId = session.customer;

        // Update tenant subscription
        await adminDb.collection('tenants').doc(tenantId).update({
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: customerId,
          subscriptionStartAt: new Date(),
          subscriptionUpdatedAt: new Date()
        });

        logger.info(`[Subscription] Activated for tenant ${tenantId}, tier ${tier}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const subscriptionId = session.subscription;
        const tenantId = session.metadata?.tenantId;

        if (tenantId) {
          await adminDb.collection('tenants').doc(tenantId).update({
            subscriptionStatus: 'active',
            subscriptionUpdatedAt: new Date()
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const subscriptionId = session.subscription;
        const tenantId = session.metadata?.tenantId;

        if (tenantId) {
          await adminDb.collection('tenants').doc(tenantId).update({
            subscriptionStatus: 'past_due',
            subscriptionUpdatedAt: new Date()
          });

          // Send notification about failed payment
          logger.warn(`[Subscription] Payment failed for tenant ${tenantId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const { tenantId, tier } = session.metadata;

        // Downgrade to FREE tier
        await adminDb.collection('tenants').doc(tenantId).update({
          subscriptionTier: SUBSCRIPTION_TIERS.FREE.name,
          subscriptionStatus: 'cancelled',
          subscriptionEndAt: new Date(),
          subscriptionUpdatedAt: new Date()
        });

        logger.info(`[Subscription] Cancelled for tenant ${tenantId}`);
        break;
      }

      default:
        logger.info(`[Subscription] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    logger.error('[Subscription] Webhook error:', error);
    throw error;
  }
}

async function cancelSubscription(tenantId, stripe, adminDb) {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      throw new Error('Tenant not found');
    }

    const tenant = tenantDoc.data();

    if (!tenant.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    // Cancel at period end
    await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await adminDb.collection('tenants').doc(tenantId).update({
      subscriptionStatus: 'cancel_at_period_end',
      subscriptionUpdatedAt: new Date()
    });

    logger.info(`[Subscription] Cancelled at period end for tenant ${tenantId}`);
    return { success: true };
  } catch (error) {
    logger.error('[Subscription] Failed to cancel:', error);
    throw error;
  }
}

async function getSubscriptionStatus(tenantId, adminDb) {
  try {
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return null;
    }

    const tenant = tenantDoc.data();
    const tier = SUBSCRIPTION_TIERS[tenant.subscriptionTier] || SUBSCRIPTION_TIERS.FREE;

    return {
      tier: tenant.subscriptionTier,
      status: tenant.subscriptionStatus,
      tierConfig: tier,
      startAt: tenant.subscriptionStartAt,
      endAt: tenant.subscriptionEndAt,
      cancelAtPeriodEnd: tenant.subscriptionStatus === 'cancel_at_period_end'
    };
  } catch (error) {
    logger.error('[Subscription] Failed to get status:', error);
    throw error;
  }
}

module.exports = {
  SUBSCRIPTION_PRICES,
  createSubscriptionCheckout,
  handleSubscriptionWebhook,
  cancelSubscription,
  getSubscriptionStatus
};
