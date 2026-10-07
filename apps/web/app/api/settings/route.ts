import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const data = await request.json();

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        anthropicApiKey: data.anthropicApiKey || null,
        anthropicModel: data.anthropicModel || "claude-sonnet-5-5",
        googleClientId: data.googleClientId || null,
        googleClientSecret: data.googleClientSecret || null,
        telegramBotToken: data.telegramBotToken || null,
        telegramChatId: data.telegramChatId || null,
        evolutionApiUrl: data.evolutionApiUrl || null,
        evolutionApiKey: data.evolutionApiKey || null,
        aiDefaultTone: data.aiDefaultTone || "professional",
        aiCustomPrompt: data.aiCustomPrompt || null,
        aiBusinessContext: data.aiBusinessContext || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
