"use client";

import Link from "next/link";
import { Card, Badge } from "@tremor/react";
import { Activity, Bot, MessageSquare, RefreshCw, Settings, Star, User } from "lucide-react";

interface ActivityLogItem {
  id: string;
  category: string;
  type: string;
  status: string;
  message: string;
  createdAt: string;
  actor: string | null;
}

interface ActivityListProps {
  logs: ActivityLogItem[];
  activeCategory: string;
  activeStatus: string;
}

const CATEGORY_FILTERS = [
  { label: "Todo", value: "ALL" },
  { label: "Reseñas", value: "REVIEW" },
  { label: "Respuestas", value: "REPLY" },
  { label: "Automatizaciones", value: "AUTOMATION" },
  { label: "Sincronización", value: "SYNC" },
  { label: "Configuración", value: "SETTINGS" },
  { label: "Cuenta", value: "ACCOUNT" },
];

const STATUS_FILTERS = [
  { label: "Cualquier estado", value: "ALL" },
  { label: "Correctas", value: "SUCCESS" },
  { label: "Fallidas", value: "FAILED" },
  { label: "Omitidas", value: "SKIPPED" },
  { label: "Info", value: "INFO" },
];

const CATEGORY_ICONS: Record<string, typeof Activity> = {
  REVIEW: Star,
  REPLY: MessageSquare,
  AUTOMATION: Bot,
  SYNC: RefreshCw,
  SETTINGS: Settings,
  ACCOUNT: User,
};

const STATUS_META: Record<string, { label: string; color: "emerald" | "red" | "gray" | "blue" }> = {
  SUCCESS: { label: "Correcta", color: "emerald" },
  FAILED: { label: "Fallida", color: "red" },
  SKIPPED: { label: "Omitida", color: "gray" },
  INFO: { label: "Info", color: "blue" },
};

function buildHref(category: string, status: string) {
  const params = new URLSearchParams();
  if (category !== "ALL") params.set("category", category);
  if (status !== "ALL") params.set("status", status);
  const query = params.toString();
  return query ? `/dashboard/activity?${query}` : "/dashboard/activity";
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
        active ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-muted"
      }`}
    >
      {label}
    </Link>
  );
}

export function ActivityList({ logs, activeCategory, activeStatus }: ActivityListProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <FilterLink
              key={filter.value}
              href={buildHref(filter.value, activeStatus)}
              active={activeCategory === filter.value}
              label={filter.label}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <FilterLink
              key={filter.value}
              href={buildHref(activeCategory, filter.value)}
              active={activeStatus === filter.value}
              label={filter.label}
            />
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Sin actividad todavía</h3>
            <p className="text-muted-foreground text-sm">
              Aquí verás las reseñas nuevas, respuestas, automatizaciones y cambios de configuración.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const meta = STATUS_META[log.status] ?? STATUS_META.INFO;
            const CategoryIcon = CATEGORY_ICONS[log.category] ?? Activity;
            return (
              <Card key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <CategoryIcon
                    className={`w-5 h-5 mt-0.5 shrink-0 ${
                      log.status === "SUCCESS"
                        ? "text-emerald-500"
                        : log.status === "FAILED"
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={meta.color} size="sm">
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.actor ?? "Sistema"}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.createdAt).toLocaleString("es-ES")}
                      </span>
                    </div>
                    <p
                      className={`text-sm mt-1 break-words ${
                        log.status === "FAILED" ? "text-red-600" : ""
                      }`}
                    >
                      {log.message}
                    </p>
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
