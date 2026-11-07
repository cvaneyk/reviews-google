import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await db.user.update({
      where: { id: (session.user as any).id },
      data: { tourCompletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tour completion error:", error);
    return NextResponse.json({ error: "Error al guardar el tour" }, { status: 500 });
  }
}
