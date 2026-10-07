import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@repo/database";
import { LocationsList } from "@/components/locations/locations-list";

async function getLocations(tenantId: string) {
  return db.location.findMany({
    where: { tenantId },
    include: {
      _count: { select: { reviews: true } },
    },
    orderBy: { name: "asc" },
  });
}

async function getGoogleAccounts(tenantId: string) {
  return db.googleAccount.findMany({
    where: { tenantId },
  });
}

export default async function LocationsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay cuenta configurada.</p>
      </div>
    );
  }

  const [locations, googleAccounts] = await Promise.all([
    getLocations(tenantId),
    getGoogleAccounts(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ubicaciones</h1>
        <p className="text-muted-foreground">Gestiona tus ubicaciones de Google Business</p>
      </div>

      <LocationsList locations={locations} hasGoogleAccount={googleAccounts.length > 0} />
    </div>
  );
}
