import { db, type ActivityCategory, type ActivityStatus, type Prisma } from "@repo/database";

interface LogActivityInput {
  tenantId: string;
  category: ActivityCategory;
  type: string;
  message: string;
  status?: ActivityStatus;
  userId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

// Nunca lanza: un fallo al registrar actividad no debe romper la acción principal
export async function logActivity(input: LogActivityInput) {
  try {
    await db.activityLog.create({
      data: {
        tenantId: input.tenantId,
        category: input.category,
        type: input.type,
        message: input.message,
        status: input.status ?? "SUCCESS",
        userId: input.userId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}

export function stars(rating: number) {
  return "⭐".repeat(rating);
}
