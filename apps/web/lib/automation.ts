import { db } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { detectLanguage } from "@repo/shared";
import { publishReplyToGoogle } from "./google-reply";

interface RuleConditions {
  minRating?: number;
  maxRating?: number;
  languages?: string[];
  keywords?: string[];
  hasComment?: boolean;
}

type TenantConfig = {
  anthropicApiKey: string | null;
  anthropicModel: string | null;
  aiDefaultTone: string | null;
  aiBusinessContext: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  evolutionApiUrl: string | null;
  evolutionApiKey: string | null;
};

type ReviewForRules = {
  starRating: number;
  comment: string | null;
  language: string | null;
};

export interface AutomationResult {
  rule: string;
  action: string;
  success: boolean;
  message: string;
  data?: any;
  skipped?: boolean;
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });
  return res.json();
}

async function generateAIReply(
  tenant: TenantConfig,
  review: ReviewForRules & { reviewerName: string },
  locationName: string
) {
  const apiKey = tenant.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });
  const model = tenant.anthropicModel || "claude-sonnet-5-5";
  const tone = tenant.aiDefaultTone || "professional";
  const detectedLanguage = review.language || detectLanguage(review.comment || "");

  const toneDescriptions: Record<string, string> = {
    professional: "profesional y formal",
    friendly: "amigable y cercano",
    empathetic: "empático y comprensivo",
  };

  let systemPrompt = `Eres un representante de atención al cliente para ${locationName}.
Tu tarea es responder a reseñas de clientes. Sigue estas reglas:
- Responde en el MISMO IDIOMA que la reseña (detectado: ${detectedLanguage})
- Mantén las respuestas concisas: 2-4 oraciones
- Sé ${toneDescriptions[tone] || toneDescriptions.professional}
- Para reseñas negativas: reconoce el problema, discúlpate y ofrece solución
- Nunca seas defensivo`;

  if (tenant.aiBusinessContext) {
    systemPrompt += `\n\nContexto del negocio: ${tenant.aiBusinessContext}`;
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Responde a esta reseña:\nRating: ${"⭐".repeat(review.starRating)} (${review.starRating}/5)\nCliente: ${review.reviewerName}\nReseña: ${review.comment || "(Sin comentario)"}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : null;
}

function matchesConditions(review: ReviewForRules, conditions: RuleConditions): boolean {
  if (conditions.minRating && review.starRating < conditions.minRating) return false;
  if (conditions.maxRating && review.starRating > conditions.maxRating) return false;
  if (conditions.hasComment && !review.comment) return false;
  if (
    conditions.languages?.length &&
    review.language &&
    !conditions.languages.includes(review.language)
  ) {
    return false;
  }
  if (conditions.keywords?.length && review.comment) {
    const commentLower = review.comment.toLowerCase();
    if (!conditions.keywords.some((kw) => commentLower.includes(kw.toLowerCase()))) return false;
  }
  return true;
}

type ReviewWithLocation = ReviewForRules & {
  id: string;
  reviewerName: string;
  location: { name: string };
};

type RuleRow = {
  id: string;
  name: string;
  action: string;
  conditions: unknown;
};

async function executeRule(
  rule: RuleRow,
  review: ReviewWithLocation,
  tenant: TenantConfig | null,
  tenantId: string,
  options: { testMode?: boolean }
): Promise<AutomationResult> {
  const base = { rule: rule.name, action: rule.action };

  if (!matchesConditions(review, rule.conditions as RuleConditions)) {
    return { ...base, success: false, message: "No cumple las condiciones", skipped: true };
  }

  switch (rule.action) {
    case "NOTIFY_TELEGRAM": {
      if (!tenant?.telegramBotToken || !tenant?.telegramChatId) {
        return {
          ...base,
          success: false,
          message: "Telegram no configurado (falta Bot Token o Chat ID)",
        };
      }

      const stars = "⭐".repeat(review.starRating);
      const body = review.comment ? `"${review.comment}"` : "(Sin comentario)";
      const message = `<b>Nueva reseña ${stars}</b>\n\n${review.location.name}\n${review.reviewerName}\n${body}`;

      if (options.testMode) {
        return {
          ...base,
          success: true,
          message: "Mensaje preparado (modo prueba)",
          data: { preview: message },
        };
      }

      const telegramRes = await sendTelegramMessage(
        tenant.telegramBotToken,
        tenant.telegramChatId,
        message
      );

      return {
        ...base,
        success: Boolean(telegramRes.ok),
        message: telegramRes.ok
          ? "Notificación enviada"
          : `Error: ${telegramRes.description || telegramRes.error_code || "desconocido"}`,
      };
    }

    case "GENERATE_AI_REPLY":
    case "AUTO_REPLY": {
      if (!tenant?.anthropicApiKey && !process.env.ANTHROPIC_API_KEY) {
        return { ...base, success: false, message: "API key de Anthropic no configurada" };
      }

      const aiReply = await generateAIReply(tenant!, review, review.location.name);

      if (!aiReply) {
        return { ...base, success: false, message: "Error al generar respuesta con IA" };
      }

      if (options.testMode) {
        return {
          ...base,
          success: true,
          message: "Respuesta generada (modo prueba, no se guarda)",
          data: { reply: aiReply },
        };
      }

      const isAutoReply = rule.action === "AUTO_REPLY";

      const replyRow = await db.reviewReply.create({
        data: {
          reviewId: review.id,
          content: aiReply,
          isAiGenerated: true,
          aiModel: tenant?.anthropicModel || "claude-sonnet-5-5",
          status: isAutoReply ? "PENDING" : "DRAFT",
        },
        select: { id: true },
      });

      if (!isAutoReply) {
        return {
          ...base,
          success: true,
          message: "Borrador generado, pendiente de tu aprobación",
          data: { reply: aiReply },
        };
      }

      try {
        await publishReplyToGoogle(tenantId, review.id, aiReply);
        await db.reviewReply.update({
          where: { id: replyRow.id },
          data: { status: "SENT", sentAt: new Date() },
        });
        return {
          ...base,
          success: true,
          message: "Respuesta publicada en Google",
          data: { reply: aiReply },
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await db.reviewReply.update({
          where: { id: replyRow.id },
          data: { status: "FAILED", errorMessage },
        });
        return {
          ...base,
          success: false,
          message: `No se pudo publicar en Google: ${errorMessage}`,
          data: { reply: aiReply },
        };
      }
    }

    case "NOTIFY_WHATSAPP":
      return { ...base, success: false, message: "WhatsApp aún no implementado" };

    default:
      return { ...base, success: false, message: "Acción desconocida" };
  }
}

export async function runAutomationForReview(
  reviewId: string,
  tenantId: string,
  options: { ruleId?: string; testMode?: boolean } = {}
): Promise<AutomationResult[]> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { location: true },
  });

  if (!review || review.tenantId !== tenantId) {
    throw new Error("Reseña no encontrada");
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      anthropicApiKey: true,
      anthropicModel: true,
      aiDefaultTone: true,
      aiBusinessContext: true,
      telegramBotToken: true,
      telegramChatId: true,
      evolutionApiUrl: true,
      evolutionApiKey: true,
    },
  });

  const rules = options.ruleId
    ? await db.automationRule.findMany({ where: { id: options.ruleId, tenantId } })
    : await db.automationRule.findMany({
        where: { tenantId, isActive: true },
        orderBy: { priority: "asc" },
      });

  const results: AutomationResult[] = [];

  for (const rule of rules) {
    let result: AutomationResult;

    try {
      result = await executeRule(rule, review, tenant, tenantId, options);
    } catch (err) {
      result = {
        rule: rule.name,
        action: rule.action,
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }

    results.push(result);

    if (!options.testMode) {
      await db.automationExecution.create({
        data: {
          ruleId: rule.id,
          reviewId: review.id,
          status: result.skipped ? "SKIPPED" : result.success ? "SUCCESS" : "FAILED",
          errorMessage: result.success ? null : result.message,
          result: result.data ? (result.data as object) : undefined,
        },
      });
    }
  }

  return results;
}
