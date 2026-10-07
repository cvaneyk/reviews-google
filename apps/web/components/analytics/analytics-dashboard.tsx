"use client";

import { Card, Metric, Text } from "@tremor/react";
import { TrendingUp, Star, Calendar } from "lucide-react";

interface AnalyticsDashboardProps {
  analytics: {
    totalReviews: number;
    avgRating: number;
    last30Days: number;
  };
}

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <div>
              <Text>Total Reseñas</Text>
              <Metric>{analytics.totalReviews}</Metric>
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-emerald-500" />
            <div>
              <Text>Rating Promedio</Text>
              <Metric>{analytics.avgRating.toFixed(1)} ⭐</Metric>
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="violet">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-violet-500" />
            <div>
              <Text>Últimos 30 días</Text>
              <Metric>{analytics.last30Days}</Metric>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Text className="font-medium mb-4">Tendencias</Text>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Conecta tu cuenta de Google Business para ver las tendencias de tus reseñas.
        </div>
      </Card>
    </div>
  );
}
