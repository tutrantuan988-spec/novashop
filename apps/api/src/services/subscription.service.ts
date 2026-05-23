import Stripe from 'stripe';
import { prisma } from '@/db/prisma-client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const SUBSCRIPTION_PLANS = {
  STARTER: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    amount: 290000,
    name: 'Starter',
  },
  PROFESSIONAL: {
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    amount: 890000,
    name: 'Professional',
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    amount: 2890000,
    name: 'Enterprise',
  },
};

export class SubscriptionService {
  async createCheckoutSession(organizationId: string, plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig || !planConfig.priceId) {
      throw new Error('Invalid plan');
    }

    // Create or get Stripe customer
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: `${organization.slug}@novashop.com`,
        name: organization.name,
        metadata: { organizationId },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
      metadata: {
        organizationId,
        plan,
      },
      subscription_data: {
        metadata: {
          organizationId,
          plan,
        },
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { organizationId, plan } = session.metadata || {};

        if (organizationId && plan) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionTier: plan,
              subscriptionStatus: 'active',
              stripeSubscriptionId: session.subscription as string,
              subscriptionStartAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { organizationId } = subscription.metadata || {};

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionStatus: 'active',
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { organizationId } = subscription.metadata || {};

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionStatus: 'past_due',
              updatedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const { organizationId } = subscription.metadata || {};

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              subscriptionTier: 'FREE',
              subscriptionStatus: 'cancelled',
              subscriptionEndAt: new Date(),
              updatedAt: new Date(),
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      default:
        break;
    }
  }

  async cancelSubscription(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization || !organization.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    await stripe.subscriptions.update(organization.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'cancel_at_period_end',
        updatedAt: new Date(),
      },
    });
  }

  async getSubscriptionStatus(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return null;
    }

    const plan = SUBSCRIPTION_PLANS[organization.subscriptionTier as keyof typeof SUBSCRIPTION_PLANS];

    return {
      tier: organization.subscriptionTier,
      status: organization.subscriptionStatus,
      planConfig: plan || null,
      startAt: organization.subscriptionStartAt,
      endAt: organization.subscriptionEndAt,
      cancelAtPeriodEnd: organization.subscriptionStatus === 'cancel_at_period_end',
    };
  }
}

export const subscriptionService = new SubscriptionService();
