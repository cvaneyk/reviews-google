"use client";

import Link from "next/link";
import { Card, Badge } from "@tremor/react";
import { CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";

interface Execution {
  id: string;
  status: string;
  errorMessage: string | null;
  executedAt: string;
  ruleName: string;
  action: string;
  review: {
    id: string;
    reviewerName: string;
    starRating: number;
    comment: string | null;
  } | null;
}

interface ActivityListProps {
  executions: Execution[];
  activeStatus: string;
}

const FILTERS = [
  { label: "Todas", value: "ALL" },
  { label: "Correctas", value: "SUCCESS" },
  { label: "Fallidas", value: "FAILED" },
  { label: "Omitidas", value: "SKIPPED" },
];

const ACTION_LABELS: Record<string, string> = {
  NOTIFY_TELEGRAM: "Telegram",
  NOTIFY_WHATSAPP: "WhatsApp",
  AUTO_REPLY: "Respuesta automática",
  GENERATE_AI_REPLY: "Borrador con IA",
};

const STATUS_META: Record<
  string,
  { label: string; color: "emerald" | "red" | "gray"; Icon: typeof CheckCircle2 }
> = {
  SUCCESS: { label: "Correcta", color: "emerald", Icon: CheckCircle2 },
  FAILED: { label: "Fallida", color: "red", Icon: XCircle },
  SKIPPED: { label: "Omitida", color: "gray", Icon: MinusCircle },
};

export function ActivityList({ executions, activeStatus }: ActivityListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "ALL" ? "/dashboard/activity" : `/dashboard/activity?status=${filter.value}`}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              activeStatus === filter.value
                ? "bg-primary text-primary-foreground border-transparent"
                : "hover:bg-muted"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {executions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Sin actividad todavía</h3>
            <p className="text-muted-foreground text-sm">
              Aquí verás cada regla que se ejecute cuando lleguen reseñas nuevas.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => {
            const meta = STATUS_META[execution.status] ?? STATUS_META.SKIPPED;
            return (
              <Card key={execution.id} className="p-4">
                <div className="flex items-start gap-3">
                  <meta.Icon
                    className={`w-5 h-5 mt-0.5 shrink-0 ${
                      execution.status === "SUCCESS"
                        ? "text-emerald-500"
                        : execution.status === "FAILED"
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{execution.ruleName}</span>
                      <Badge color={meta.color} size="sm">
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ACTION_LABELS[execution.action] ?? execution.action}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(execution.executedAt).toLocaleString("es-ES")}
                      </span>
                    </div>

                    {execution.review && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {"⭐".repeat(execution.review.starRating)} {execution.review.reviewerName}
                        {execution.review.comment ? ` — ${execution.review.comment}` : ""}
                      </p>
                    )}

                    {execution.errorMessage && (
                      <p className="text-sm text-red-600 mt-2 bg-red-500/10 rounded p-2">
                        {execution.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
