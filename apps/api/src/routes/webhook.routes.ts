import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

router.post('/', webhookController.createWebhook.bind(webhookController));
router.get('/:organizationId', webhookController.getWebhooks.bind(webhookController));
router.put('/:id', webhookController.updateWebhook.bind(webhookController));
router.delete('/:id', webhookController.deleteWebhook.bind(webhookController));
router.get('/:id/logs', webhookController.getWebhookLogs.bind(webhookController));

export default router;
