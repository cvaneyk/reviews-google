import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseRange(from?: string, to?: string) {
  const now = new Date();
  const fallbackFrom = new Date(now.getTime() - 365 * DAY_MS);

  const parsedFrom = from ? new Date(`${from}T00:00:00.000Z`) : fallbackFrom;
  const parsedTo = to ? new Date(`${to}T23:59:59.999Z`) : now;

  return {
    from: Number.isNaN(parsedFrom.getTime()) ? fallbackFrom : parsedFrom,
    to: Number.isNaN(parsedTo.getTime()) ? now : parsedTo,
  };
}

function bucketKeys(from: Date, to: Date, daily: boolean) {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), daily ? from.getUTCDate() : 1)
  );

  while (cursor <= to) {
    keys.push(cursor.toISOString().slice(0, daily ? 10 : 7));
    if (daily) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return keys;
}

async function getAnalytics(tenantId: string, from: Date, to: Date) {
  const reviews = await db.review.findMany({
    where: { tenantId, createTime: { gte: from, lte: to } },
    select: { starRating: true, createTime: true, reviewReplyText: true },
    orderBy: { createTime: "asc" },
  });

  const daily = to.getTime() - from.getTime() <= 62 * DAY_MS;
  const keys = bucketKeys(from, to, daily);

  const buckets = new Map(keys.map((key) => [key, { count: 0, ratingSum: 0 }]));
  const distribution = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: 0 }));

  let ratingSum = 0;
  let repliedCount = 0;

  for (const review of reviews) {
    const key = review.createTime.toISOString().slice(0, daily ? 10 : 7);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
      bucket.ratingSum += review.starRating;
    }

    ratingSum += review.starRating;
    if (review.reviewReplyText) repliedCount++;

    const slot = distribution.find((d) => d.stars === review.starRating);
    if (slot) slot.count++;
  }

  const series = keys.map((key) => {
    const bucket = buckets.get(key)!;
    return {
      periodo: key,
      Reseñas: bucket.count,
      "Rating medio": bucket.count ? Number((bucket.ratingSum / bucket.count).toFixed(2)) : null,
    };
  });

  return {
    totalReviews: reviews.length,
    avgRating: reviews.length ? ratingSum / reviews.length : 0,
    repliedCount,
    series,
    distribution: distribution.map((d) => ({
      name: `${d.stars} estrellas`,
      Reseñas: d.count,
    })),
  };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const { from, to } = parseRange(searchParams.from, searchParams.to);
  const analytics = await getAnalytics(tenantId, from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analíticas</h1>
        <p className="text-muted-foreground">Estadísticas y tendencias de tus reseñas</p>
      </div>

      <AnalyticsDashboard analytics={analytics} from={toDateInput(from)} to={toDateInput(to)} />
    </div>
  );
}
