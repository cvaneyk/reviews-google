import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Review Manager
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Gestiona las reseñas de Google Business de forma inteligente.
            Responde con IA, automatiza respuestas y recibe notificaciones
            en tiempo real.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/login"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold leading-6 text-foreground hover:text-primary"
            >
              Crear cuenta <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold">Centraliza Reseñas</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Todas tus reseñas de Google Business en un solo lugar.
              Filtra por ubicación, rating y estado.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold">Respuestas con IA</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Genera respuestas profesionales con Claude AI en el idioma
              de cada reseña.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="text-2xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recibe alertas en Telegram o WhatsApp cuando lleguen
              nuevas reseñas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
