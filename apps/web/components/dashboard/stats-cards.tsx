"use client";

import { Card, Metric, Text, Flex, ProgressBar } from "@tremor/react";

interface StatsCardsProps {
  totalReviews: number;
  pendingReplies: number;
  avgRating: number;
  responseRate: number;
  ratingDistribution: { starRating: number; _count: number }[];
}

export function StatsCards({
  totalReviews,
  pendingReplies,
  avgRating,
  responseRate,
  ratingDistribution,
}: StatsCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card decoration="top" decorationColor="blue">
          <Text>Total Reseñas</Text>
          <Metric>{totalReviews}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Pendientes de Respuesta</Text>
          <Metric>{pendingReplies}</Metric>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Rating Promedio</Text>
          <Metric>{avgRating.toFixed(1)} ⭐</Metric>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>Tasa de Respuesta</Text>
          <Metric>{responseRate.toFixed(0)}%</Metric>
          <Flex className="mt-2">
            <ProgressBar value={responseRate} color="violet" />
          </Flex>
        </Card>
      </div>

      <Card>
        <Text className="font-medium">Distribución de Ratings</Text>
        <div className="mt-4 space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              ratingDistribution.find((r) => r.starRating === rating)?._count || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-16 text-sm">{"⭐".repeat(rating)}</span>
                <ProgressBar
                  value={percentage}
                  color={rating >= 4 ? "emerald" : rating === 3 ? "amber" : "red"}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
