import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

const GOOGLE_BUSINESS_API = "https://mybusinessbusinessinformation.googleapis.com/v1";

async function refreshTokenIfNeeded(googleAccount: any) {
  if (new Date(googleAccount.expiresAt) > new Date()) {
    return googleAccount.accessToken;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: googleAccount.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    throw new Error("Failed to refresh token");
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

    const accessToken = await refreshTokenIfNeeded(googleAccount);

    // Get accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok) {
      console.error("Google API error:", JSON.stringify(accountsData, null, 2));
      return NextResponse.json(
        {
          error: "Error al obtener cuentas de Google Business",
          details: accountsData.error?.message || JSON.stringify(accountsData)
        },
        { status: 500 }
      );
    }

    const accounts = accountsData.accounts || [];
    let totalLocations = 0;

    for (const account of accounts) {
      // Get locations for each account
      const locationsRes = await fetch(
        `${GOOGLE_BUSINESS_API}/${account.name}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,metadata`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const locationsData = await locationsRes.json();

      if (!locationsRes.ok) {
        console.error("Locations API error:", locationsData);
        continue;
      }

      const locations = locationsData.locations || [];

      for (const loc of locations) {
        const googleLocationId = loc.name.split("/").pop();
        const address = loc.storefrontAddress
          ? [
              loc.storefrontAddress.addressLines?.join(", "),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.administrativeArea,
            ]
              .filter(Boolean)
              .join(", ")
          : null;

        await db.location.upsert({
          where: {
            tenantId_googleLocationId: {
              tenantId,
              googleLocationId,
            },
          },
          update: {
            name: loc.title,
            address,
            phone: loc.phoneNumbers?.primaryPhone,
            website: loc.websiteUri,
            placeId: loc.metadata?.placeId,
          },
          create: {
            tenantId,
            googleAccountId: googleAccount.id,
            googleLocationId,
            name: loc.title,
            address,
            phone: loc.phoneNumbers?.primaryPhone,
            website: loc.websiteUri,
            placeId: loc.metadata?.placeId,
          },
        });
        totalLocations++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronizadas ${totalLocations} ubicaciones`,
      count: totalLocations,
    });
  } catch (error) {
    console.error("Sync locations error:", error);
    return NextResponse.json(
      { error: "Error al sincronizar ubicaciones" },
      { status: 500 }
    );
  }
}
