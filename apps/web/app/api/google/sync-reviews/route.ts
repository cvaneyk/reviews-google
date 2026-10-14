import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncReviewsForTenant } from "@/lib/google-sync";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;

  try {
    const result = await syncReviewsForTenant(tenantId);

    await logActivity({
      tenantId,
      userId,
      category: "SYNC",
      type: "sync.reviews",
      status: result.errors.length > 0 ? "FAILED" : "SUCCESS",
      message: `Sincronización manual: ${result.totalReviews} reseñas (${result.newReviewIds.length} nuevas)`,
      metadata: {
        source: "manual",
        totalReviews: result.totalReviews,
        newReviews: result.newReviewIds.length,
        errors: result.errors,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sincronizadas ${result.totalReviews} reseñas (${result.newReviewIds.length} nuevas)`,
      totalReviews: result.totalReviews,
      newReviews: result.newReviewIds.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Sync reviews error:", error);
    await logActivity({
      tenantId,
      userId,
      category: "SYNC",
      type: "sync.reviews",
      status: "FAILED",
      message: `Error en la sincronización manual: ${
        error instanceof Error ? error.message : "error desconocido"
      }`,
      metadata: { source: "manual" },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al sincronizar reseñas" },
      { status: 500 }
    );
  }
}
