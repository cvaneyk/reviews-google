import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { SettingsPanel } from "@/components/settings/settings-panel";

async function getTenantData(tenantId: string) {
  const [tenant, googleAccounts] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId } }),
    db.googleAccount.findMany({ where: { tenantId } }),
  ]);
  return { tenant, googleAccounts };
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const { tenant, googleAccounts } = await getTenantData(tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y conexiones</p>
      </div>

      <SettingsPanel tenant={tenant} googleAccounts={googleAccounts} />
    </div>
  );
}
