"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@tremor/react";
import { Zap, Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  action: string;
  conditions: {
    minRating?: number;
    maxRating?: number;
    languages?: string[];
    keywords?: string[];
    hasComment?: boolean;
  };
  delayMinutes: number;
}

interface AutomationRulesProps {
  rules: AutomationRule[];
}

const ACTIONS = [
  { value: "AUTO_REPLY", label: "Responder automáticamente con IA", icon: "🤖" },
  { value: "NOTIFY_TELEGRAM", label: "Notificar por Telegram", icon: "📱" },
  { value: "NOTIFY_WHATSAPP", label: "Notificar por WhatsApp", icon: "💬" },
  { value: "GENERATE_AI_REPLY", label: "Generar borrador con IA", icon: "✍️" },
];

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "pt", label: "Portugués" },
  { value: "it", label: "Italiano" },
];

export function AutomationRules({ rules }: AutomationRulesProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    action: "AUTO_REPLY",
    minRating: 1,
    maxRating: 5,
    languages: [] as string[],
    keywords: "",
    hasComment: false,
    delayMinutes: 0,
  });

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      action: "AUTO_REPLY",
      minRating: 1,
      maxRating: 5,
      languages: [],
      keywords: "",
      hasComment: false,
      delayMinutes: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      action: rule.action,
      minRating: rule.conditions.minRating || 1,
      maxRating: rule.conditions.maxRating || 5,
      languages: rule.conditions.languages || [],
      keywords: rule.conditions.keywords?.join(", ") || "",
      hasComment: rule.conditions.hasComment || false,
      delayMinutes: rule.delayMinutes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      const url = editingRule
        ? `/api/automation/rules/${editingRule.id}`
        : "/api/automation/rules";
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          action: formData.action,
          conditions: {
            minRating: formData.minRating,
            maxRating: formData.maxRating,
            languages: formData.languages.length > 0 ? formData.languages : undefined,
            keywords: formData.keywords ? formData.keywords.split(",").map(k => k.trim()).filter(Boolean) : undefined,
            hasComment: formData.hasComment || undefined,
          },
          delayMinutes: formData.delayMinutes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta regla?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/automation/rules/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (rule: AutomationRule) => {
    try {
      await fetch(`/api/automation/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      router.refresh();
    } catch {
      alert("Error al actualizar");
    }
  };

  const getActionLabel = (action: string) => {
    return ACTIONS.find(a => a.value === action)?.label || action;
  };

  const getActionIcon = (action: string) => {
    return ACTIONS.find(a => a.value === action)?.icon || "⚡";
  };

  if (rules.length === 0 && !showModal) {
    return (
      <Card>
        <div className="text-center py-12">
          <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Sin reglas de automatización</h3>
          <p className="text-muted-foreground mb-4">
            Crea reglas para responder automáticamente o recibir notificaciones.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Crear Regla
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rules.length} regla{rules.length !== 1 ? "s" : ""} configurada{rules.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Nueva Regla
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="w-4 h-4" />
                <span className="text-2xl">{getActionIcon(rule.action)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{rule.name}</h3>
                  <Badge color={rule.isActive ? "emerald" : "gray"} size="sm">
                    {rule.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getActionLabel(rule.action)}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-muted rounded">
                    ⭐ {rule.conditions.minRating}-{rule.conditions.maxRating} estrellas
                  </span>
                  {rule.conditions.languages && rule.conditions.languages.length > 0 && (
                    <span className="px-2 py-1 bg-muted rounded">
                      🌐 {rule.conditions.languages.join(", ")}
                    </span>
                  )}
                  {rule.delayMinutes > 0 && (
                    <span className="px-2 py-1 bg-muted rounded">
                      ⏱️ {rule.delayMinutes} min de retraso
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(rule)}
                  className={`px-3 py-1 rounded text-xs ${
                    rule.isActive
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                >
                  {rule.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => openEditModal(rule)}
                  className="p-2 hover:bg-muted rounded"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  disabled={deleting === rule.id}
                  className="p-2 hover:bg-red-100 text-red-600 rounded disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                {editingRule ? "Editar Regla" : "Nueva Regla de Automatización"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Responder reseñas negativas"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional"
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Acción</label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.icon} {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Condiciones</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Rating mínimo</label>
                    <select
                      value={formData.minRating}
                      onChange={(e) => setFormData({ ...formData, minRating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} ⭐</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Rating máximo</label>
                    <select
                      value={formData.maxRating}
                      onChange={(e) => setFormData({ ...formData, maxRating: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg bg-background"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} ⭐</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-muted-foreground mb-1">Idiomas (opcional)</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <label key={lang.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, languages: [...formData.languages, lang.value] });
                            } else {
                              setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang.value) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{lang.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-muted-foreground mb-1">
                    Palabras clave (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="mal servicio, lento, problema"
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.hasComment}
                      onChange={(e) => setFormData({ ...formData, hasComment: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Solo reseñas con comentario</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1">
                  Retraso antes de ejecutar (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.delayMinutes}
                  onChange={(e) => setFormData({ ...formData, delayMinutes: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  0 = ejecutar inmediatamente
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : editingRule ? "Guardar Cambios" : "Crear Regla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
