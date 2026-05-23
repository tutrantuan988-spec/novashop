import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';

const router = Router();

router.post('/checkout', subscriptionController.createCheckout.bind(subscriptionController));
router.get('/:organizationId', subscriptionController.getSubscription.bind(subscriptionController));
router.post('/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));

export default router;
