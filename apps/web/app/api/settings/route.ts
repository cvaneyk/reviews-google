import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { logActivity } from "@/lib/activity";

const FIELD_LABELS: Record<string, string> = {
  name: "nombre del negocio",
  anthropicApiKey: "API key de Anthropic",
  anthropicModel: "modelo de IA",
  googleClientId: "Google Client ID",
  googleClientSecret: "Google Client Secret",
  telegramBotToken: "token de Telegram",
  telegramChatId: "chat de Telegram",
  evolutionApiUrl: "URL de Evolution API",
  evolutionApiKey: "API key de Evolution",
  aiDefaultTone: "tono de IA",
  aiCustomPrompt: "prompt personalizado",
  aiBusinessContext: "contexto del negocio",
};

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const data = await request.json();

    const updates = {
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
    };

    const previous = await db.tenant.findUnique({ where: { id: tenantId } });

    await db.tenant.update({
      where: { id: tenantId },
      data: updates,
    });

    // Solo se registran los nombres de los campos, nunca los valores (contienen secretos)
    const changed = (Object.keys(updates) as (keyof typeof updates)[]).filter(
      (key) => previous && previous[key] !== updates[key]
    );

    if (changed.length > 0) {
      await logActivity({
        tenantId,
        userId: (session.user as any).id,
        category: "SETTINGS",
        type: "settings.updated",
        message: `Configuración actualizada: ${changed.map((key) => FIELD_LABELS[key]).join(", ")}`,
        metadata: { changedFields: changed },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
