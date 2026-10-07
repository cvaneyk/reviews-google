import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { ReviewsList } from "@/components/reviews/reviews-list";

async function getReviews(tenantId: string) {
  return db.review.findMany({
    where: { tenantId },
    include: { location: true },
    orderBy: { createTime: "desc" },
    take: 50,
  });
}

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const reviews = await getReviews(tenantId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reseñas</h1>
          <p className="text-muted-foreground">Gestiona las reseñas de tus ubicaciones</p>
        </div>
      </div>

      <ReviewsList reviews={reviews} />
    </div>
  );
}
