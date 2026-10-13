import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

const GOOGLE_ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GOOGLE_BUSINESS_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GOOGLE_REVIEWS_API = "https://mybusiness.googleapis.com/v4";

async function refreshTokenIfNeeded(googleAccount: any, tenantId: string) {
  if (new Date(googleAccount.expiresAt) > new Date()) {
    return googleAccount.accessToken;
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { googleClientId: true, googleClientSecret: true },
  });

  if (!tenant?.googleClientId || !tenant?.googleClientSecret) {
    throw new Error("El tenant no tiene credenciales de Google OAuth configuradas");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: tenant.googleClientId,
      client_secret: tenant.googleClientSecret,
      refresh_token: googleAccount.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${tokens.error_description || tokens.error}`);
  }

  await db.googleAccount.update({
    where: { id: googleAccount.id },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    const googleAccount = await db.googleAccount.findFirst({
      where: { tenantId },
    });

    if (!googleAccount) {
      return NextResponse.json(
        { error: "No hay cuenta de Google conectada" },
        { status: 400 }
      );
    }

    const accessToken = await refreshTokenIfNeeded(googleAccount, tenantId);

    // Get all locations for this tenant
    const locations = await db.location.findMany({
      where: { tenantId },
      select: { id: true, googleLocationId: true },
    });

    if (locations.length === 0) {
      return NextResponse.json(
        { error: "No hay ubicaciones sincronizadas. Sincroniza ubicaciones primero." },
        { status: 400 }
      );
    }

    // Get accounts to build full location names
    const accountsRes = await fetch(`${GOOGLE_ACCOUNTS_API}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok) {
      console.error("Google accounts error:", accountsData);
      return NextResponse.json(
        { error: "Error al obtener cuentas de Google Business" },
        { status: 500 }
      );
    }

    let totalReviews = 0;
    let newReviews = 0;
    const errors: string[] = [];

    for (const account of accountsData.accounts || []) {
      // Get locations from Google to match with our stored locations
      const locationsRes = await fetch(
        `${GOOGLE_BUSINESS_API}/${account.name}/locations?readMask=name,title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const locationsData = await locationsRes.json();

      if (!locationsRes.ok) continue;

      for (const googleLoc of locationsData.locations || []) {
        const googleLocationId = googleLoc.name.split("/").pop();
        const localLocation = locations.find((l) => l.googleLocationId === googleLocationId);

        if (!localLocation) continue;

        // Fetch reviews for this location
        try {
          const reviewsRes = await fetch(
            `${GOOGLE_REVIEWS_API}/${googleLoc.name}/reviews?pageSize=100`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!reviewsRes.ok) {
            const errorData = await reviewsRes.json();
            console.error(`Reviews error for ${googleLoc.name}:`, errorData);
            errors.push(`${googleLoc.title}: ${errorData.error?.message || reviewsRes.statusText}`);
            continue;
          }

          const reviewsData = await reviewsRes.json();
          const reviews = reviewsData.reviews || [];

          for (const review of reviews) {
            const googleReviewId = review.name.split("/").pop();

            const existingReview = await db.review.findUnique({
              where: { googleReviewId },
            });

            const reviewData = {
              locationId: localLocation.id,
              tenantId,
              reviewerName: review.reviewer?.displayName || "Usuario anónimo",
              reviewerPhotoUrl: review.reviewer?.profilePhotoUrl,
              starRating: review.starRating === "FIVE" ? 5 :
                          review.starRating === "FOUR" ? 4 :
                          review.starRating === "THREE" ? 3 :
                          review.starRating === "TWO" ? 2 : 1,
              comment: review.comment || null,
              reviewReplyText: review.reviewReply?.comment || null,
              createTime: new Date(review.createTime),
              updateTime: new Date(review.updateTime),
            };

            if (existingReview) {
              await db.review.update({
                where: { googleReviewId },
                data: {
                  ...reviewData,
                  isNew: false,
                },
              });
            } else {
              await db.review.create({
                data: {
                  googleReviewId,
                  ...reviewData,
                  isNew: true,
                },
              });
              newReviews++;
            }
            totalReviews++;
          }

          // Update location lastSyncAt
          await db.location.update({
            where: { id: localLocation.id },
            data: { lastSyncAt: new Date() },
          });
        } catch (err) {
          console.error(`Error syncing reviews for ${googleLoc.name}:`, err);
          errors.push(`${googleLoc.title}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizadas ${totalReviews} reseñas (${newReviews} nuevas)`,
      totalReviews,
      newReviews,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Sync reviews error:", error);
    return NextResponse.json(
      {
        error: "Error al sincronizar reseñas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
