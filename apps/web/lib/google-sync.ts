import { db } from "@repo/database";
import { getGoogleCredentials } from "./google-auth";
import { logActivity, stars } from "./activity";

const GOOGLE_ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GOOGLE_BUSINESS_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GOOGLE_REVIEWS_API = "https://mybusiness.googleapis.com/v4";

const STAR_RATINGS: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export interface SyncReviewsResult {
  totalReviews: number;
  newReviewIds: string[];
  errors: string[];
}


export async function syncReviewsForTenant(tenantId: string): Promise<SyncReviewsResult> {
  const locations = await db.location.findMany({
    where: { tenantId },
    select: { id: true, googleLocationId: true },
  });

  if (locations.length === 0) {
    throw new Error("No hay ubicaciones sincronizadas. Sincroniza ubicaciones primero.");
  }

  const { authHeader } = await getGoogleCredentials(tenantId);

  const accountsRes = await fetch(`${GOOGLE_ACCOUNTS_API}/accounts`, { headers: authHeader });
  const accountsData = await accountsRes.json();

  if (!accountsRes.ok) {
    throw new Error(
      `Error al obtener cuentas de Google Business: ${accountsData.error?.message || accountsRes.status}`
    );
  }

  const result: SyncReviewsResult = { totalReviews: 0, newReviewIds: [], errors: [] };

  for (const account of accountsData.accounts || []) {
    const locationsRes = await fetch(
      `${GOOGLE_BUSINESS_API}/${account.name}/locations?readMask=name,title`,
      { headers: authHeader }
    );
    const locationsData = await locationsRes.json();

    if (!locationsRes.ok) {
      result.errors.push(
        `Ubicaciones de ${account.name}: ${locationsData.error?.message || locationsRes.status}`
      );
      continue;
    }

    for (const googleLoc of locationsData.locations || []) {
      const googleLocationId = googleLoc.name.split("/").pop();
      const localLocation = locations.find((l) => l.googleLocationId === googleLocationId);

      if (!localLocation) continue;

      try {
        // El API v1 devuelve name="locations/{id}"; el endpoint v4 de reviews exige la ruta con cuenta
        const reviewPath = `${account.name}/locations/${googleLocationId}`;
        await syncLocationReviews(
          reviewPath,
          { id: localLocation.id, name: googleLoc.title },
          tenantId,
          authHeader,
          result
        );
      } catch (err) {
        result.errors.push(
          `${googleLoc.title}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  return result;
}

async function syncLocationReviews(
  reviewPath: string,
  location: { id: string; name: string },
  tenantId: string,
  authHeader: Record<string, string>,
  result: SyncReviewsResult
) {
  const locationId = location.id;
  let pageToken: string | undefined;

  do {
    const url = new URL(`${GOOGLE_REVIEWS_API}/${reviewPath}/reviews`);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const reviewsRes = await fetch(url.toString(), { headers: authHeader });

    if (!reviewsRes.ok) {
      const errorData = await reviewsRes.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${reviewsRes.status}`);
    }

    const reviewsData = await reviewsRes.json();

    for (const review of reviewsData.reviews || []) {
      const googleReviewId = review.name.split("/").pop();

      const data = {
        locationId,
        tenantId,
        googleReviewName: review.name,
        reviewerName: review.reviewer?.displayName || "Usuario anónimo",
        reviewerPhotoUrl: review.reviewer?.profilePhotoUrl || null,
        starRating: STAR_RATINGS[review.starRating] ?? 0,
        comment: review.comment || null,
        reviewReplyText: review.reviewReply?.comment || null,
        createTime: new Date(review.createTime),
        updateTime: new Date(review.updateTime),
      };

      const existing = await db.review.findUnique({
        where: { googleReviewId },
        select: { id: true },
      });

      if (existing) {
        await db.review.update({ where: { googleReviewId }, data });
      } else {
        const created = await db.review.create({
          data: { googleReviewId, ...data, isNew: true },
          select: { id: true },
        });
        result.newReviewIds.push(created.id);

        await logActivity({
          tenantId,
          category: "REVIEW",
          type: "review.received",
          message: `Nueva reseña ${stars(data.starRating)} de ${data.reviewerName} en ${location.name}`,
          metadata: { reviewId: created.id, starRating: data.starRating },
        });
      }

      result.totalReviews++;
    }

    pageToken = reviewsData.nextPageToken;
  } while (pageToken);

  await db.location.update({
    where: { id: locationId },
    data: { lastSyncAt: new Date() },
  });
}
