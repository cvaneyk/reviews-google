import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

async function getAnalytics(tenantId: string) {
  const [totalReviews, avgRating, last30Days] = await Promise.all([
    db.review.count({ where: { tenantId } }),
    db.review.aggregate({ where: { tenantId }, _avg: { starRating: true } }),
    db.review.count({
      where: {
        tenantId,
        createTime: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totalReviews,
    avgRating: avgRating._avg.starRating || 0,
    last30Days,
  };
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const analytics = await getAnalytics(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analíticas</h1>
        <p className="text-muted-foreground">Estadísticas y tendencias de tus reseñas</p>
      </div>

      <AnalyticsDashboard analytics={analytics} />
    </div>
  );
}
