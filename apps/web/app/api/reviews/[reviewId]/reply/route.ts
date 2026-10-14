import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { publishReplyToGoogle } from "@/lib/google-reply";

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
    select: { id: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }

  try {
    await publishReplyToGoogle(tenantId, params.reviewId, reply.trim());
  } catch (error) {
    console.error("Reply publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al publicar en Google" },
      { status: 502 }
    );
  }

  await db.reviewReply.updateMany({
    where: { reviewId: params.reviewId, status: { in: ["DRAFT", "PENDING"] } },
    data: { status: "SENT", sentAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: "Respuesta publicada en Google",
  });
}
