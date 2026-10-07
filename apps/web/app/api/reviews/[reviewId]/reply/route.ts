import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
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
    });

    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    // Guardar la respuesta localmente
    await db.review.update({
      where: { id: params.reviewId },
      data: {
        reviewReplyText: reply,
        isNew: false,
      },
    });

    // TODO: Cuando tengamos acceso a la API de Google, enviar la respuesta también a Google
    // await googleBusinessClient.replyToReview(review.googleReviewId, reply);

    return NextResponse.json({
      success: true,
      message: "Respuesta guardada correctamente",
    });
  } catch (error) {
    console.error("Reply error:", error);
    return NextResponse.json({ error: "Error al guardar respuesta" }, { status: 500 });
  }
}
