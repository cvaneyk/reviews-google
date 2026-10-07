import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { AutomationRules } from "@/components/automation/automation-rules";

async function getRules(tenantId: string) {
  return db.automationRule.findMany({
    where: { tenantId },
    orderBy: { priority: "asc" },
  });
}

export default async function AutomationPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const rules = await getRules(tenantId);

  const formattedRules = rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    isActive: rule.isActive,
    priority: rule.priority,
    action: rule.action,
    conditions: (rule.conditions || {}) as {
      minRating?: number;
      maxRating?: number;
      languages?: string[];
      keywords?: string[];
      hasComment?: boolean;
    },
    delayMinutes: rule.delayMinutes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Automatización</h1>
        <p className="text-muted-foreground">Configura respuestas automáticas y notificaciones</p>
      </div>

      <AutomationRules rules={formattedRules} />
    </div>
  );
}
