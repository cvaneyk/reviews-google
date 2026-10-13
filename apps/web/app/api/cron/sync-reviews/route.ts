import { NextResponse } from "next/server";
import { db } from "@repo/database";
import { syncReviewsForTenant } from "@/lib/google-sync";
import { runAutomationForReview } from "@/lib/automation";

export const dynamic = "force-dynamic";

interface TenantSummary {
  tenantId: string;
  tenantName: string;
  totalReviews?: number;
  newReviews?: number;
  automationsRun?: number;
  errors?: string[];
  failed?: string;
}

async function handler(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado en el servidor" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "");

  if (provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenants = await db.tenant.findMany({
    where: { googleAccounts: { some: {} } },
    select: { id: true, name: true },
  });

  const summaries: TenantSummary[] = [];

  for (const tenant of tenants) {
    try {
      const result = await syncReviewsForTenant(tenant.id);
      let automationsRun = 0;

      for (const reviewId of result.newReviewIds) {
        try {
          await runAutomationForReview(reviewId, tenant.id);
          automationsRun++;
        } catch (err) {
          result.errors.push(
            `Automatización de ${reviewId}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      summaries.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        totalReviews: result.totalReviews,
        newReviews: result.newReviewIds.length,
        automationsRun,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    } catch (err) {
      summaries.push({
        tenantId: tenant.id,
        tenantName: tenant.name,
        failed: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log("Cron sync-reviews:", JSON.stringify(summaries));

  return NextResponse.json({
    success: true,
    tenantsProcessed: tenants.length,
    summaries,
  });
}

export const GET = handler;
export const POST = handler;
