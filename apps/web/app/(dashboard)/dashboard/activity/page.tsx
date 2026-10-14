import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, type ActivityCategory, type ActivityStatus } from "@repo/database";
import { ActivityList } from "@/components/activity/activity-list";

const VALID_CATEGORIES: ActivityCategory[] = [
  "REVIEW",
  "REPLY",
  "AUTOMATION",
  "SYNC",
  "SETTINGS",
  "ACCOUNT",
];
const VALID_STATUSES: ActivityStatus[] = ["SUCCESS", "FAILED", "SKIPPED", "INFO"];

async function getActivity(
  tenantId: string,
  category?: ActivityCategory,
  status?: ActivityStatus
) {
  const logs = await db.activityLog.findMany({
    where: {
      tenantId,
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return logs.map((log) => ({
    id: log.id,
    category: log.category,
    type: log.type,
    status: log.status,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    actor: log.user ? log.user.name || log.user.email : null,
  }));
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const category = VALID_CATEGORIES.find((c) => c === searchParams.category);
  const status = VALID_STATUSES.find((s) => s === searchParams.status);
  const logs = await getActivity(tenantId, category, status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Actividad</h1>
        <p className="text-muted-foreground">
          Registro de todo lo que ocurre en tu cuenta: reseñas, respuestas, automatizaciones y cambios
        </p>
      </div>

      <ActivityList
        logs={logs}
        activeCategory={category ?? "ALL"}
        activeStatus={status ?? "ALL"}
      />
    </div>
  );
}
