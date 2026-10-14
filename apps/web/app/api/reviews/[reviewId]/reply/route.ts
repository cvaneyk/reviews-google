import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { publishReplyToGoogle } from "@/lib/google-reply";
import { logActivity, stars } from "@/lib/activity";

export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const { reply } = await request.json();

  if (!reply?.trim()) {
    return NextResponse.json({ error: "La respuesta no puede estar vacía" }, { status: 400 });
  }

  const review = await db.review.findFirst({
    where: { id: params.reviewId, tenantId },
    select: { id: true, reviewerName: true, starRating: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }

  const userId = (session.user as any).id;
  const reviewLabel = `${stars(review.starRating)} ${review.reviewerName}`;

  try {
    await publishReplyToGoogle(tenantId, params.reviewId, reply.trim());
  } catch (error) {
    console.error("Reply publish error:", error);
    await logActivity({
      tenantId,
      userId,
      category: "REPLY",
      type: "reply.failed",
      status: "FAILED",
      message: `No se pudo publicar la respuesta a ${reviewLabel}: ${
        error instanceof Error ? error.message : "error desconocido"
      }`,
      metadata: { reviewId: review.id },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al publicar en Google" },
      { status: 502 }
    );
  }

  await db.reviewReply.updateMany({
    where: { reviewId: params.reviewId, status: { in: ["DRAFT", "PENDING"] } },
    data: { status: "SENT", sentAt: new Date() },
  });

  await logActivity({
    tenantId,
    userId,
    category: "REPLY",
    type: "reply.published",
    message: `Respuesta publicada en Google a ${reviewLabel}`,
    metadata: { reviewId: review.id, reply: reply.trim() },
  });

  return NextResponse.json({
    success: true,
    message: "Respuesta publicada en Google",
  });
}
