import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const tenantId = (session.user as any).tenantId;
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { googleClientId: true },
  });

  if (!tenant?.googleClientId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=missing_google_credentials", process.env.NEXTAUTH_URL!)
    );
  }

  const params = new URLSearchParams({
    client_id: tenant.googleClientId,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google-business/callback`,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: tenantId,
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
