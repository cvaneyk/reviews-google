import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: (session.user as any).id },
    select: { tourCompletedAt: true },
  });

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar autoStartTour={Boolean(user) && !user?.tourCompletedAt} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
