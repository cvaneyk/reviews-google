import { Worker, Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const reviewSyncQueue = new Queue("review-sync", { connection });
export const autoReplyQueue = new Queue("auto-reply", { connection });
export const notificationsQueue = new Queue("notifications", { connection });

console.log("Worker starting...");

const reviewSyncWorker = new Worker(
  "review-sync",
  async (job) => {
    console.log(`Processing review sync job: ${job.id}`);
    const { locationId, tenantId } = job.data;
    console.log(`Syncing reviews for location ${locationId}, tenant ${tenantId}`);
    return { success: true };
  },
  {
    connection,
    concurrency: 2,
  }
);

const autoReplyWorker = new Worker(
  "auto-reply",
  async (job) => {
    console.log(`Processing auto-reply job: ${job.id}`);
    const { reviewId, tenantId } = job.data;
    console.log(`Auto-replying to review ${reviewId}, tenant ${tenantId}`);
    return { success: true };
  },
  {
    connection,
    concurrency: 1,
  }
);

const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    console.log(`Processing notification job: ${job.id}`);
    const { channel, payload } = job.data;
    console.log(`Sending notification via ${channel}`);
    return { success: true };
  },
  {
    connection,
    concurrency: 5,
  }
);

reviewSyncWorker.on("completed", (job) => {
  console.log(`Review sync job ${job.id} completed`);
});

reviewSyncWorker.on("failed", (job, err) => {
  console.error(`Review sync job ${job?.id} failed:`, err.message);
});

autoReplyWorker.on("completed", (job) => {
  console.log(`Auto-reply job ${job.id} completed`);
});

notificationsWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} completed`);
});

async function setupCronJobs() {
  await reviewSyncQueue.upsertJobScheduler(
    "sync-all-reviews",
    { pattern: "*/15 * * * *" },
    {
      name: "sync-all-reviews",
      data: { type: "full-sync" },
    }
  );
  console.log("Cron job scheduled: sync reviews every 15 minutes");
}

setupCronJobs().catch(console.error);

console.log("Worker started successfully");

process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await reviewSyncWorker.close();
  await autoReplyWorker.close();
  await notificationsWorker.close();
  await connection.quit();
  process.exit(0);
});
