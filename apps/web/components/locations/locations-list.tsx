"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@tremor/react";
import { MapPin, Star, RefreshCw } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string | null;
  _count: { reviews: number };
}

interface LocationsListProps {
  locations: Location[];
  hasGoogleAccount: boolean;
}

export function LocationsList({ locations, hasGoogleAccount }: LocationsListProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/google/sync-locations", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        alert(data.details || data.error || "Error al sincronizar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSyncing(false);
    }
  };

  if (!hasGoogleAccount) {
    return (
      <Card>
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Conecta tu cuenta de Google</h3>
          <p className="text-muted-foreground mb-4">
            Para ver tus ubicaciones, primero conecta tu cuenta de Google Business.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Ir a Configuración
          </a>
        </div>
      </Card>
    );
  }

  if (locations.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No hay ubicaciones</h3>
          <p className="text-muted-foreground mb-4">
            Sincroniza tus ubicaciones desde Google Business Profile.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Ubicaciones"}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{location.name}</h3>
                {location.address && (
                  <p className="text-sm text-muted-foreground truncate">{location.address}</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4" />
                  <span>{location._count.reviews} reseñas</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
