import { db } from "@repo/database";
import { getGoogleCredentials } from "./google-auth";

const GOOGLE_REVIEWS_API = "https://mybusiness.googleapis.com/v4";

export async function publishReplyToGoogle(
  tenantId: string,
  reviewId: string,
  comment: string
): Promise<void> {
  const review = await db.review.findFirst({
    where: { id: reviewId, tenantId },
    select: { googleReviewName: true },
  });

  if (!review) {
    throw new Error("Reseña no encontrada");
  }

  if (!review.googleReviewName) {
    throw new Error(
      "Esta reseña no tiene la ruta de Google guardada. Sincroniza las reseñas y vuelve a intentarlo."
    );
  }

  const { authHeader } = await getGoogleCredentials(tenantId);

  const response = await fetch(`${GOOGLE_REVIEWS_API}/${review.googleReviewName}/reply`, {
    method: "PUT",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `Google rechazó la respuesta (HTTP ${response.status})`
    );
  }

  await db.review.update({
    where: { id: reviewId },
    data: { reviewReplyText: comment, isNew: false },
  });
}
