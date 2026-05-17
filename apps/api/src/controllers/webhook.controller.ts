import { Request, Response } from 'express';
import { prisma } from '@/db/prisma-client';
import { z } from 'zod';

const createWebhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
});

const updateWebhookSchema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export class WebhookController {
  async createWebhook(req: Request, res: Response) {
    try {
      const userId = req.body.userId;
      const organizationId = req.body.organizationId;
      const body = createWebhookSchema.parse(req.body);

      // Check if user has permission
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền tạo webhook' });
      }

      const webhook = await prisma.webhook.create({
        data: {
          organizationId,
          name: body.name,
          url: body.url,
          secret: body.secret,
          events: body.events,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: 'CREATE',
          entityType: 'Webhook',
          entityId: webhook.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(201).json(webhook);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Webhook] Create error:', error);
      res.status(500).json({ error: 'Tạo webhook thất bại' });
    }
  }

  async getWebhooks(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;
      const userId = req.body.userId;

      // Check if user is member
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId,
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
      }

      const webhooks = await prisma.webhook.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      res.json(webhooks);
    } catch (error: any) {
      console.error('[Webhook] Get error:', error);
      res.status(500).json({ error: 'Lấy danh sách webhook thất bại' });
    }
  }

  async updateWebhook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      const body = updateWebhookSchema.parse(req.body);

      const webhook = await prisma.webhook.findUnique({
        where: { id },
        include: { organization: true },
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook không tồn tại' });
      }

      // Check if user has permission
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: webhook.organizationId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật webhook' });
      }

      const updatedWebhook = await prisma.webhook.update({
        where: { id },
        data: body,
      });

      res.json(updatedWebhook);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Webhook] Update error:', error);
      res.status(500).json({ error: 'Cập nhật webhook thất bại' });
    }
  }

  async deleteWebhook(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      const webhook = await prisma.webhook.findUnique({
        where: { id },
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook không tồn tại' });
      }

      // Check if user has permission
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: webhook.organizationId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa webhook' });
      }

      await prisma.webhook.delete({
        where: { id },
      });

      res.json({ message: 'Đã xóa webhook thành công' });
    } catch (error: any) {
      console.error('[Webhook] Delete error:', error);
      res.status(500).json({ error: 'Xóa webhook thất bại' });
    }
  }

  async getWebhookLogs(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      const webhook = await prisma.webhook.findUnique({
        where: { id },
      });

      if (!webhook) {
        return res.status(404).json({ error: 'Webhook không tồn tại' });
      }

      // Check if user is member
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: webhook.organizationId,
          userId,
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
      }

      const logs = await prisma.webhookLog.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(logs);
    } catch (error: any) {
      console.error('[Webhook] Get logs error:', error);
      res.status(500).json({ error: 'Lấy logs thất bại' });
    }
  }
}

export const webhookController = new WebhookController();
