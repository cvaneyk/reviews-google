"use client";

import { Card, Badge } from "@tremor/react";
import { Bell, MessageCircle, Send } from "lucide-react";

interface NotificationConfig {
  id: string;
  channel: string;
  isActive: boolean;
  config: unknown;
}

interface NotificationsConfigProps {
  configs: NotificationConfig[];
}

export function NotificationsConfig({ configs }: NotificationsConfigProps) {
  const telegramConfig = configs.find((c) => c.channel === "TELEGRAM");
  const whatsappConfig = configs.find((c) => c.channel === "WHATSAPP");

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Send className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Telegram</h3>
              <Badge color={telegramConfig?.isActive ? "emerald" : "gray"}>
                {telegramConfig?.isActive ? "Conectado" : "No configurado"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Recibe notificaciones instantáneas de nuevas reseñas en Telegram.
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
              {telegramConfig ? "Editar" : "Configurar"}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">WhatsApp</h3>
              <Badge color={whatsappConfig?.isActive ? "emerald" : "gray"}>
                {whatsappConfig?.isActive ? "Conectado" : "No configurado"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Recibe notificaciones de reseñas por WhatsApp via Evolution API.
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
              {whatsappConfig ? "Editar" : "Configurar"}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Preferencias de Notificación</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Notificar reseñas de 1-2 estrellas</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm">Notificar reseñas de 3 estrellas</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Notificar reseñas de 4-5 estrellas</span>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
