"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, BarChart, Card, Metric, Text } from "@tremor/react";
import { TrendingUp, Star, MessageSquare } from "lucide-react";

interface AnalyticsDashboardProps {
  analytics: {
    totalReviews: number;
    avgRating: number;
    repliedCount: number;
    series: { periodo: string; Reseñas: number; "Rating medio": number | null }[];
    distribution: { name: string; Reseñas: number }[];
  };
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESETS = [
  { label: "30 días", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "12 meses", days: 365 },
  { label: "Todo", days: 3650 },
];

function toInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AnalyticsDashboard({ analytics, from, to }: AnalyticsDashboardProps) {
  const router = useRouter();
  const [range, setRange] = useState({ from, to });

  const applyRange = (nextFrom: string, nextTo: string) => {
    setRange({ from: nextFrom, to: nextTo });
    router.push(`/dashboard/analytics?from=${nextFrom}&to=${nextTo}`);
  };

  const applyPreset = (days: number) => {
    const now = new Date();
    applyRange(toInput(new Date(now.getTime() - days * DAY_MS)), toInput(now));
  };

  const isEmpty = analytics.totalReviews === 0;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Desde</label>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Hasta</label>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
              className="px-3 py-2 border rounded-lg bg-background text-sm"
            />
          </div>
          <button
            onClick={() => applyRange(range.from, range.to)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
          >
            Aplicar
          </button>

          <div className="flex flex-wrap gap-2 md:ml-auto">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.days)}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-muted"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <Text>Reseñas en el periodo</Text>
              <Metric>{analytics.totalReviews}</Metric>
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-emerald-500" />
            <div>
              <Text>Rating promedio</Text>
              <Metric>{analytics.avgRating.toFixed(1)} ⭐</Metric>
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="violet">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-violet-500" />
            <div>
              <Text>Respondidas</Text>
              <Metric>{analytics.repliedCount}</Metric>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Text className="font-medium mb-4">Reseñas por periodo</Text>
        {isEmpty ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No hay reseñas en el rango seleccionado. Prueba a ampliar las fechas.
          </div>
        ) : (
          <AreaChart
            className="h-64"
            data={analytics.series}
            index="periodo"
            categories={["Reseñas"]}
            colors={["blue"]}
            showAnimation
          />
        )}
      </Card>

      <Card>
        <Text className="font-medium mb-4">Distribución por estrellas</Text>
        {isEmpty ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Sin datos en el rango seleccionado.
          </div>
        ) : (
          <BarChart
            className="h-64"
            data={analytics.distribution}
            index="name"
            categories={["Reseñas"]}
            colors={["amber"]}
            showAnimation
          />
        )}
      </Card>
    </div>
  );
}
