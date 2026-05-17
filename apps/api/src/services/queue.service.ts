import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL);

export const emailQueue = new Queue('emails', { connection });

export const uploadQueue = new Queue('uploads', { connection });

export const billingQueue = new Queue('billing', { connection });

export const analyticsQueue = new Queue('analytics', { connection });

const emailWorker = new Worker(
  'emails',
  async (_job: Job) => {},
  { connection }
);

const uploadWorker = new Worker(
  'uploads',
  async (_job: Job) => {},
  { connection }
);

const billingWorker = new Worker(
  'billing',
  async (_job: Job) => {},
  { connection }
);

const analyticsWorker = new Worker(
  'analytics',
  async (_job: Job) => {},
  { connection }
);

export class QueueService {
  async addEmailJob(data: { to: string; subject: string; html: string }) {
    return emailQueue.add('send-email', data);
  }

  async addUploadJob(data: { fileUrl: string; organizationId: string }) {
    return uploadQueue.add('process-upload', data);
  }

  async addBillingJob(data: { organizationId: string; action: string }) {
    return billingQueue.add('process-billing', data);
  }

  async addAnalyticsJob(data: { organizationId: string; metrics: any }) {
    return analyticsQueue.add('process-analytics', data);
  }
}

export const queueService = new QueueService();

process.on('SIGTERM', async () => {
  await emailWorker.close();
  await uploadWorker.close();
  await billingWorker.close();
  await analyticsWorker.close();
  await connection.quit();
  process.exit(0);
});
