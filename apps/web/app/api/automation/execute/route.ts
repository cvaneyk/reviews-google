import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAutomationForReview } from "@/lib/automation";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const { reviewId, ruleId, testMode } = await request.json();

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId requerido" }, { status: 400 });
  }

  try {
    const results = await runAutomationForReview(reviewId, tenantId, { ruleId, testMode });
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Automation execute error:", error);
    return NextResponse.json(
      { error: "Error al ejecutar automatización", details: error?.message },
      { status: 500 }
    );
  }
}
