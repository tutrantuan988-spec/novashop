import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';

export class SubscriptionController {
  async createCheckout(req: Request, res: Response) {
    try {
      const { organizationId, plan } = req.body;

      if (!organizationId || !plan) {
        return res.status(400).json({ error: 'Thiếu organizationId hoặc plan' });
      }

      const checkout = await subscriptionService.createCheckoutSession(organizationId, plan);
      res.json(checkout);
    } catch (error: any) {
      console.error('[Subscription] Checkout error:', error);
      res.status(500).json({ error: error.message || 'Tạo checkout thất bại' });
    }
  }

  async getSubscription(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;

      const status = await subscriptionService.getSubscriptionStatus(organizationId as string);
      if (!status) {
        return res.status(404).json({ error: 'Organization không tồn tại' });
      }

      res.json(status);
    } catch (error: any) {
      console.error('[Subscription] Get status error:', error);
      res.status(500).json({ error: 'Lấy subscription status thất bại' });
    }
  }

  async cancelSubscription(req: Request, res: Response) {
    try {
      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({ error: 'Thiếu organizationId' });
      }

      await subscriptionService.cancelSubscription(organizationId);
      res.json({ message: 'Đã hủy subscription thành công' });
    } catch (error: any) {
      console.error('[Subscription] Cancel error:', error);
      res.status(500).json({ error: error.message || 'Hủy subscription thất bại' });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        return res.status(400).json({ error: 'Webhook secret not configured' });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      await subscriptionService.handleWebhook(event);

      res.json({ received: true });
    } catch (error: any) {
      console.error('[Subscription] Webhook error:', error);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  }
}

export const subscriptionController = new SubscriptionController();
