import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@repo/database";
import { slugify } from "@repo/shared";

export async function POST(request: Request) {
  try {
    const { email, password, name, businessName } = await request.json();

    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = slugify(businessName) + "-" + Date.now().toString(36);

    const tenant = await db.tenant.create({
      data: {
        name: businessName,
        slug,
        users: {
          create: {
            email,
            name,
            passwordHash,
            role: "OWNER",
          },
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: tenant.users[0].id,
        email: tenant.users[0].email,
        name: tenant.users[0].name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Error al crear la cuenta" },
      { status: 500 }
    );
  }
}
