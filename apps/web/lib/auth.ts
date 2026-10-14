import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@repo/database";
import { logActivity } from "./activity";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos");
        }

        const user = await db.user.findFirst({
          where: { email: credentials.email },
          include: { tenant: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Credenciales inválidas");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          await logActivity({
            tenantId: user.tenantId,
            userId: user.id,
            category: "ACCOUNT",
            type: "account.login_failed",
            status: "FAILED",
            message: `Intento de inicio de sesión fallido para ${user.email}`,
          });
          throw new Error("Credenciales inválidas");
        }

        await logActivity({
          tenantId: user.tenantId,
          userId: user.id,
          category: "ACCOUNT",
          type: "account.login",
          status: "INFO",
          message: `${user.name || user.email} inició sesión`,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};
