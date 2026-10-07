import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { detectLanguage } from "@repo/shared";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const { reviewId, tone = "professional", customInstructions } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId requerido" }, { status: 400 });
    }

    // Obtener configuración del tenant
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        anthropicApiKey: true,
        anthropicModel: true,
        aiDefaultTone: true,
        aiCustomPrompt: true,
        aiBusinessContext: true,
      },
    });

    const apiKey = tenant?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "API key no configurada",
        details: "Configura tu Anthropic API key en Configuración"
      }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });
    const model = tenant?.anthropicModel || "claude-sonnet-5-5";

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { location: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    const detectedLanguage = review.language || detectLanguage(review.comment || "");

    // Usar tono del request, o el configurado por el tenant, o "professional" por defecto
    const effectiveTone = tone || tenant?.aiDefaultTone || "professional";

    // Construir descripción del tono
    const toneDescriptions: Record<string, string> = {
      professional: "profesional y formal",
      friendly: "amigable y cercano",
      empathetic: "empático y comprensivo",
    };
    const toneDescription = toneDescriptions[effectiveTone] || toneDescriptions.professional;

    // Prompt base por defecto
    const defaultPrompt = `Eres un representante de atención al cliente para ${review.location.name}.

Tu tarea es responder a reseñas de clientes de forma profesional. Sigue estas reglas:
- Responde en el MISMO IDIOMA que la reseña (detectado: ${detectedLanguage})
- Mantén las respuestas concisas: 2-4 oraciones
- Sé ${toneDescription}
- Agradece al cliente por su feedback
- Para reseñas negativas: reconoce el problema y ofrece una solución
- Para reseñas positivas: expresa gratitud e invita a volver
- Nunca seas defensivo o argumentativo`;

    // Usar prompt personalizado del tenant si existe, o el default
    let systemPrompt = tenant?.aiCustomPrompt || defaultPrompt;

    // Añadir contexto del negocio si está configurado
    if (tenant?.aiBusinessContext) {
      systemPrompt += `\n\nContexto del negocio: ${tenant.aiBusinessContext}`;
    }

    // Añadir instrucciones adicionales del request si las hay
    if (customInstructions) {
      systemPrompt += `\n\nInstrucciones adicionales: ${customInstructions}`;
    }

    const userMessage = `Por favor escribe una respuesta a esta reseña:

Rating: ${"⭐".repeat(review.starRating)} (${review.starRating}/5)
Cliente: ${review.reviewerName}
Reseña: ${review.comment || "(Sin comentario)"}`;

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No se recibió respuesta de texto");
    }

    return NextResponse.json({
      reply: textBlock.text,
      detectedLanguage,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("AI generation error:", error);
    const errorMessage = error?.message || error?.error?.message || "Error desconocido";
    return NextResponse.json({
      error: "Error al generar respuesta",
      details: errorMessage
    }, { status: 500 });
  }
}
