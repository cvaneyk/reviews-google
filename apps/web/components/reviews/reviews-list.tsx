"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@tremor/react";
import { Sparkles, X, Send, Pencil } from "lucide-react";

interface Review {
  id: string;
  googleReviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string | null;
  reviewReplyText: string | null;
  createTime: Date;
  location: { name: string };
}

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const openReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reviewReplyText || "");
  };

  const closeModal = () => {
    setSelectedReview(null);
    setReplyText("");
  };

  const generateWithAI = async () => {
    if (!selectedReview) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: selectedReview.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyText(data.reply);
      } else {
        alert(data.details || data.error || "Error al generar respuesta");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/reviews/${selectedReview.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      const data = await res.json();
      if (res.ok) {
        closeModal();
        router.refresh();
      } else {
        alert(data.error || "Error al enviar respuesta");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsSending(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "pending") return !review.reviewReplyText;
    if (filter === "replied") return !!review.reviewReplyText;
    return true;
  });

  if (reviews.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay reseñas todavía. Conecta tu cuenta de Google Business para sincronizar.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "pending", "replied"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Respondidas"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.reviewerName}</span>
                  <span className="text-yellow-500">{"⭐".repeat(review.starRating)}</span>
                  <Badge color={review.reviewReplyText ? "emerald" : "amber"} size="sm">
                    {review.reviewReplyText ? "Respondida" : "Pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {review.location.name} · {new Date(review.createTime).toLocaleDateString("es-ES")}
                </p>
                {review.comment && (
                  <p className="text-sm">{review.comment}</p>
                )}
                {review.reviewReplyText && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30">
                    <p className="text-sm text-muted-foreground">Tu respuesta:</p>
                    <p className="text-sm">{review.reviewReplyText}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => openReplyModal(review)}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 flex items-center gap-1"
              >
                {review.reviewReplyText ? (
                  <>
                    <Pencil className="w-3 h-3" />
                    Editar
                  </>
                ) : (
                  "Responder"
                )}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de respuesta */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                {selectedReview.reviewReplyText ? "Editar respuesta" : "Responder a reseña"}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Reseña original */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedReview.reviewerName}</span>
                  <span className="text-yellow-500">{"⭐".repeat(selectedReview.starRating)}</span>
                </div>
                <p className="text-sm">{selectedReview.comment || "(Sin comentario)"}</p>
              </div>

              {/* Textarea para respuesta */}
              <div>
                <label className="block text-sm font-medium mb-2">Tu respuesta</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between">
                <button
                  onClick={generateWithAI}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? "Generando..." : "Generar con IA"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-lg hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={isSending || !replyText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? "Enviando..." : "Enviar respuesta"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
