import { db } from "@repo/database";

export interface GoogleCredentials {
  accessToken: string;
  authHeader: Record<string, string>;
}

export async function getGoogleCredentials(tenantId: string): Promise<GoogleCredentials> {
  const googleAccount = await db.googleAccount.findFirst({ where: { tenantId } });

  if (!googleAccount) {
    throw new Error("No hay cuenta de Google conectada");
  }

  if (new Date(googleAccount.expiresAt) > new Date()) {
    return {
      accessToken: googleAccount.accessToken,
      authHeader: { Authorization: `Bearer ${googleAccount.accessToken}` },
    };
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
    throw new Error(
      `No se pudo renovar el token de Google: ${tokens.error_description || tokens.error}`
    );
  }

  await db.googleAccount.update({
    where: { id: googleAccount.id },
    data: {
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return {
    accessToken: tokens.access_token,
    authHeader: { Authorization: `Bearer ${tokens.access_token}` },
  };
}
