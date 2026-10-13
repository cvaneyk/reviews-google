import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncReviewsForTenant } from "@/lib/google-sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;

  try {
    const result = await syncReviewsForTenant(tenantId);

    return NextResponse.json({
      success: true,
      message: `Sincronizadas ${result.totalReviews} reseñas (${result.newReviewIds.length} nuevas)`,
      totalReviews: result.totalReviews,
      newReviews: result.newReviewIds.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Sync reviews error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al sincronizar reseñas" },
      { status: 500 }
    );
  }
}
