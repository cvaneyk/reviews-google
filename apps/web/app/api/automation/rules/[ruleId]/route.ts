import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

export async function PUT(
  request: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;
    const data = await request.json();

    const existingRule = await db.automationRule.findFirst({
      where: { id: params.ruleId, tenantId },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
    }

    const rule = await db.automationRule.update({
      where: { id: params.ruleId },
      data: {
        name: data.name ?? existingRule.name,
        description: data.description !== undefined ? data.description : existingRule.description,
        action: data.action ?? existingRule.action,
        conditions: data.conditions ?? existingRule.conditions,
        delayMinutes: data.delayMinutes ?? existingRule.delayMinutes,
        isActive: data.isActive !== undefined ? data.isActive : existingRule.isActive,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error("Update rule error:", error);
    return NextResponse.json({ error: "Error al actualizar regla" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    const existingRule = await db.automationRule.findFirst({
      where: { id: params.ruleId, tenantId },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
    }

    await db.automationRule.delete({
      where: { id: params.ruleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rule error:", error);
    return NextResponse.json({ error: "Error al eliminar regla" }, { status: 500 });
  }
}
