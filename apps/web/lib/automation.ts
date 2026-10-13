import { db } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { detectLanguage } from "@repo/shared";

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
    if (!matchesConditions(review, rule.conditions as RuleConditions)) {
      results.push({
        rule: rule.name,
        action: rule.action,
        success: false,
        message: "No cumple las condiciones",
      });
      continue;
    }

    switch (rule.action) {
      case "NOTIFY_TELEGRAM": {
        if (!tenant?.telegramBotToken || !tenant?.telegramChatId) {
          results.push({
            rule: rule.name,
            action: rule.action,
            success: false,
            message: "Telegram no configurado (falta Bot Token o Chat ID)",
          });
          break;
        }

        const stars = "⭐".repeat(review.starRating);
        const body = review.comment ? `💬 "${review.comment}"` : "(Sin comentario)";
        const message = `🔔 <b>Nueva reseña ${stars}</b>\n\n📍 ${review.location.name}\n👤 ${review.reviewerName}\n${body}`;

        if (options.testMode) {
          results.push({
            rule: rule.name,
            action: rule.action,
            success: true,
            message: "Mensaje preparado (modo prueba)",
            data: { preview: message },
          });
          break;
        }

        const telegramRes = await sendTelegramMessage(
          tenant.telegramBotToken,
          tenant.telegramChatId,
          message
        );
        results.push({
          rule: rule.name,
          action: rule.action,
          success: telegramRes.ok,
          message: telegramRes.ok
            ? "Notificación enviada"
            : `Error: ${telegramRes.description || telegramRes.error_code || "desconocido"} (Chat ID: ${tenant.telegramChatId})`,
        });
        break;
      }

      case "GENERATE_AI_REPLY":
      case "AUTO_REPLY": {
        if (!tenant?.anthropicApiKey && !process.env.ANTHROPIC_API_KEY) {
          results.push({
            rule: rule.name,
            action: rule.action,
            success: false,
            message: "API key de Anthropic no configurada",
          });
          break;
        }

        const aiReply = await generateAIReply(tenant!, review, review.location.name);

        if (!aiReply) {
          results.push({
            rule: rule.name,
            action: rule.action,
            success: false,
            message: "Error al generar respuesta con IA",
          });
          break;
        }

        await db.reviewReply.create({
          data: {
            reviewId: review.id,
            content: aiReply,
            isAiGenerated: true,
            aiModel: tenant?.anthropicModel || "claude-sonnet-5-5",
            status: rule.action === "AUTO_REPLY" ? "PENDING" : "DRAFT",
          },
        });

        results.push({
          rule: rule.name,
          action: rule.action,
          success: true,
          message:
            rule.action === "AUTO_REPLY"
              ? "Respuesta generada y pendiente de envío"
              : "Borrador generado",
          data: { reply: aiReply },
        });
        break;
      }

      case "NOTIFY_WHATSAPP":
        results.push({
          rule: rule.name,
          action: rule.action,
          success: false,
          message: "WhatsApp aún no implementado",
        });
        break;

      default:
        results.push({
          rule: rule.name,
          action: rule.action,
          success: false,
          message: "Acción desconocida",
        });
    }
  }

  return results;
}
