import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { ActivityList } from "@/components/activity/activity-list";

const VALID_STATUSES = ["SUCCESS", "FAILED", "SKIPPED"] as const;

type Status = (typeof VALID_STATUSES)[number];

async function getExecutions(tenantId: string, status?: Status) {
  const executions = await db.automationExecution.findMany({
    where: {
      rule: { tenantId },
      ...(status ? { status } : {}),
    },
    include: { rule: { select: { name: true, action: true } } },
    orderBy: { executedAt: "desc" },
    take: 100,
  });

  const reviewIds = [...new Set(executions.map((e) => e.reviewId))];
  const reviews = await db.review.findMany({
    where: { id: { in: reviewIds } },
    select: { id: true, reviewerName: true, starRating: true, comment: true },
  });
  const reviewsById = new Map(reviews.map((r) => [r.id, r]));

  return executions.map((execution) => ({
    id: execution.id,
    status: execution.status,
    errorMessage: execution.errorMessage,
    executedAt: execution.executedAt.toISOString(),
    ruleName: execution.rule.name,
    action: execution.rule.action,
    review: reviewsById.get(execution.reviewId) ?? null,
  }));
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: { status?: string };
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

  const status = VALID_STATUSES.find((s) => s === searchParams.status);
  const executions = await getExecutions(tenantId, status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Actividad</h1>
        <p className="text-muted-foreground">
          Registro de las automatizaciones ejecutadas sobre tus reseñas
        </p>
      </div>

      <ActivityList executions={executions} activeStatus={status ?? "ALL"} />
    </div>
  );
}
