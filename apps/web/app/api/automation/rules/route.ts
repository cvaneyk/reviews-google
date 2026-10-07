import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const data = await request.json();

    if (!data.name?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    const maxPriority = await db.automationRule.aggregate({
      where: { tenantId },
      _max: { priority: true },
    });

    const rule = await db.automationRule.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        action: data.action || "AUTO_REPLY",
        conditions: data.conditions || {},
        delayMinutes: data.delayMinutes || 0,
        priority: (maxPriority._max.priority || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error("Create rule error:", error);
    return NextResponse.json({ error: "Error al crear regla" }, { status: 500 });
  }
}
