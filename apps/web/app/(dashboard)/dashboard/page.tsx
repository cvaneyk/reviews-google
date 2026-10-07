import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { StatsCards } from "@/components/dashboard/stats-cards";

async function getStats(tenantId: string) {
  const [totalReviews, pendingReplies, avgRating] = await Promise.all([
    db.review.count({ where: { tenantId } }),
    db.review.count({ where: { tenantId, reviewReplyText: null } }),
    db.review.aggregate({
      where: { tenantId },
      _avg: { starRating: true },
    }),
  ]);

  const ratingDistribution = await db.review.groupBy({
    by: ["starRating"],
    where: { tenantId },
    _count: true,
  });

  return {
    totalReviews,
    pendingReplies,
    avgRating: avgRating._avg.starRating || 0,
    responseRate: totalReviews > 0 ? ((totalReviews - pendingReplies) / totalReviews) * 100 : 0,
    ratingDistribution: ratingDistribution.map((r) => ({
      starRating: r.starRating,
      _count: r._count,
    })),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Configura tu cuenta</h2>
        <p className="text-muted-foreground mt-2">
          Conecta tu cuenta de Google Business para empezar.
        </p>
      </div>
    );
  }

  const stats = await getStats(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus reseñas de Google Business</p>
      </div>

      <StatsCards
        totalReviews={stats.totalReviews}
        pendingReplies={stats.pendingReplies}
        avgRating={stats.avgRating}
        responseRate={stats.responseRate}
        ratingDistribution={stats.ratingDistribution}
      />
    </div>
  );
}
