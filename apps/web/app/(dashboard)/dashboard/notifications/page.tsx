import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { NotificationsConfig } from "@/components/notifications/notifications-config";

async function getNotificationConfigs(tenantId: string) {
  return db.notificationConfig.findMany({
    where: { tenantId },
  });
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const configs = await getNotificationConfigs(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">Configura alertas por Telegram y WhatsApp</p>
      </div>

      <NotificationsConfig configs={configs} />
    </div>
  );
}
