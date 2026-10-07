"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@tremor/react";
import { Building2, Link2, User, Key, Bot, MessageCircle, Save } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  anthropicApiKey: string | null;
  anthropicModel: string | null;
  googleClientId: string | null;
  googleClientSecret: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  evolutionApiUrl: string | null;
  evolutionApiKey: string | null;
  aiDefaultTone: string | null;
  aiCustomPrompt: string | null;
  aiBusinessContext: string | null;
}

interface GoogleAccount {
  id: string;
  email: string;
}

interface SettingsPanelProps {
  tenant: Tenant | null;
  googleAccounts: GoogleAccount[];
}

const AI_MODELS = [
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (Recomendado)" },
  { value: "claude-opus-5-5", label: "Claude Opus 5.5 (Más potente)" },
  { value: "claude-fable-5-1", label: "Claude Fable 5.1 (Razonamiento avanzado)" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Más rápido)" },
];

export function SettingsPanel({ tenant, googleAccounts }: SettingsPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [config, setConfig] = useState({
    name: tenant?.name || "",
    anthropicApiKey: tenant?.anthropicApiKey || "",
    anthropicModel: tenant?.anthropicModel || "claude-sonnet-5-5",
    googleClientId: tenant?.googleClientId || "",
    googleClientSecret: tenant?.googleClientSecret || "",
    telegramBotToken: tenant?.telegramBotToken || "",
    telegramChatId: tenant?.telegramChatId || "",
    evolutionApiUrl: tenant?.evolutionApiUrl || "",
    evolutionApiKey: tenant?.evolutionApiKey || "",
    aiDefaultTone: tenant?.aiDefaultTone || "professional",
    aiCustomPrompt: tenant?.aiCustomPrompt || "",
    aiBusinessContext: tenant?.aiBusinessContext || "",
  });

  const AI_TONES = [
    { value: "professional", label: "Profesional y formal" },
    { value: "friendly", label: "Amigable y cercano" },
    { value: "empathetic", label: "Empático y comprensivo" },
  ];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Configuración guardada correctamente" });
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
          {message.text}
        </div>
      )}

      {/* Información del Negocio */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4">Información del Negocio</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Nombre</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Plan</label>
                <Badge color="blue">{tenant?.plan || "FREE"}</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Google Business Profile */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4">Google Business Profile</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Google Client ID</label>
                  <input
                    type="text"
                    value={config.googleClientId}
                    onChange={(e) => setConfig({ ...config, googleClientId: e.target.value })}
                    placeholder="xxxxx.apps.googleusercontent.com"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Google Client Secret</label>
                  <input
                    type="password"
                    value={config.googleClientSecret}
                    onChange={(e) => setConfig({ ...config, googleClientSecret: e.target.value })}
                    placeholder="GOCSPX-..."
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Cuenta conectada:</span>
                {googleAccounts.length === 0 ? (
                  <a
                    href="/api/auth/google-business"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
                  >
                    Conectar Cuenta
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{googleAccounts[0].email}</span>
                    <Badge color="emerald" size="sm">Conectada</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Anthropic / Claude AI */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-violet-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4">Inteligencia Artificial (Claude)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={config.anthropicApiKey}
                  onChange={(e) => setConfig({ ...config, anthropicApiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtén tu API key en <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-primary hover:underline">console.anthropic.com</a>
                </p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Modelo</label>
                <select
                  value={config.anthropicModel}
                  onChange={(e) => setConfig({ ...config, anthropicModel: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Personalización de respuestas</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Tono por defecto</label>
                    <select
                      value={config.aiDefaultTone}
                      onChange={(e) => setConfig({ ...config, aiDefaultTone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      {AI_TONES.map((tone) => (
                        <option key={tone.value} value={tone.value}>{tone.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Contexto del negocio</label>
                    <textarea
                      value={config.aiBusinessContext}
                      onChange={(e) => setConfig({ ...config, aiBusinessContext: e.target.value })}
                      placeholder="Ej: Somos un restaurante italiano familiar con 20 años de experiencia. Nuestro horario es de 12:00 a 23:00. Ofrecemos servicio a domicilio."
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Información sobre tu negocio que la IA usará para personalizar las respuestas
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Prompt personalizado (avanzado)</label>
                    <textarea
                      value={config.aiCustomPrompt}
                      onChange={(e) => setConfig({ ...config, aiCustomPrompt: e.target.value })}
                      placeholder="Deja vacío para usar el prompt por defecto. Si lo personalizas, incluye instrucciones completas para la IA."
                      rows={5}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo modifica esto si sabes lo que haces. Si está vacío, se usará un prompt optimizado por defecto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Telegram */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Key className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4">Telegram Bot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Bot Token</label>
                <input
                  type="password"
                  value={config.telegramBotToken}
                  onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                  placeholder="123456789:ABCdefGHI..."
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Crea un bot con <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-primary hover:underline">@BotFather</a> en Telegram
                </p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Chat ID</label>
                <input
                  type="text"
                  value={config.telegramChatId}
                  onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                  placeholder="-1001234567890 o tu ID personal"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Envía /start a tu bot, luego visita <code className="bg-muted px-1 rounded">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> para ver tu Chat ID
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* WhatsApp / Evolution API */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-4">WhatsApp (Evolution API)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Evolution API URL</label>
                <input
                  type="text"
                  value={config.evolutionApiUrl}
                  onChange={(e) => setConfig({ ...config, evolutionApiUrl: e.target.value })}
                  placeholder="https://evolution.tudominio.com"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">API Key</label>
                <input
                  type="password"
                  value={config.evolutionApiKey}
                  onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                  placeholder="Tu API key de Evolution"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>
    </div>
  );
}
