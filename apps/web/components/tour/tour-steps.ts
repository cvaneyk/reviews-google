export interface TourStep {
  route: string;
  // Valor de data-tour. Sin target, o si no existe en pantalla, el paso sale centrado
  target?: string;
  title: string;
  description: string;
}

const DASHBOARD = "/dashboard";
const REVIEWS = "/dashboard/reviews";
const LOCATIONS = "/dashboard/locations";
const AUTOMATION = "/dashboard/automation";
const ANALYTICS = "/dashboard/analytics";
const ACTIVITY = "/dashboard/activity";
const SETTINGS = "/dashboard/settings";

export const TOUR_STEPS: TourStep[] = [
  {
    route: DASHBOARD,
    title: "Bienvenido a Review Manager",
    description:
      "Te enseñamos para qué sirve cada apartado y cada ajuste. Puedes cerrar el tour cuando quieras y volver a verlo desde el menú.<br><br>Para empezar, el orden recomendado es: <b>Configuración → Ubicaciones → Reseñas → Automatización</b>.",
  },

  // Dashboard
  {
    route: DASHBOARD,
    target: "nav-dashboard",
    title: "Dashboard",
    description: "El resumen de un vistazo de las reseñas de todos tus negocios.",
  },
  {
    route: DASHBOARD,
    target: "stats-cards",
    title: "Indicadores principales",
    description: `<ul>
      <li><b>Total Reseñas:</b> todas las sincronizadas desde Google.</li>
      <li><b>Pendientes de Respuesta:</b> las que aún no tienen respuesta.</li>
      <li><b>Rating Promedio:</b> la media de estrellas.</li>
      <li><b>Tasa de Respuesta:</b> el porcentaje de reseñas respondidas.</li>
    </ul>`,
  },
  {
    route: DASHBOARD,
    target: "stats-distribution",
    title: "Distribución de Ratings",
    description: "Cuántas reseñas tienes de cada número de estrellas, de 5 a 1.",
  },

  // Reseñas
  {
    route: REVIEWS,
    target: "nav-reviews",
    title: "Reseñas",
    description: "Aquí lees y respondes las reseñas que llegan de Google.",
  },
  {
    route: REVIEWS,
    target: "reviews-filters",
    title: "Filtros",
    description: `<ul>
      <li><b>Todas:</b> la lista completa.</li>
      <li><b>Pendientes:</b> las que aún no tienen respuesta.</li>
      <li><b>Respondidas:</b> las que ya tienen respuesta.</li>
    </ul>`,
  },
  {
    route: REVIEWS,
    target: "reviews-reply",
    title: "Responder una reseña",
    description:
      "Abre una ventana donde puedes escribir la respuesta o generarla con IA, revisarla y publicarla en Google. El botón cambia a <b>Revisar borrador</b> si una regla ya preparó una respuesta y a <b>Editar</b> si la reseña ya está respondida.",
  },

  // Ubicaciones
  {
    route: LOCATIONS,
    target: "nav-locations",
    title: "Ubicaciones",
    description: "Los negocios de tu cuenta de Google Business Profile.",
  },
  {
    route: LOCATIONS,
    target: "locations-sync",
    title: "Sincronizar",
    description: `Necesitas tener tu cuenta de Google conectada en Configuración.
    <ul>
      <li><b>Sincronizar Ubicaciones:</b> trae tus negocios desde Google. Hazlo primero.</li>
      <li><b>Sincronizar Reseñas:</b> trae ahora las reseñas de esos negocios y aplica tus reglas activas a las nuevas que aún no tengan respuesta.</li>
    </ul>`,
  },

  // Automatización
  {
    route: AUTOMATION,
    target: "nav-automation",
    title: "Automatización",
    description:
      "Las reglas hacen algo por ti cuando entra una reseña nueva, tanto en la sincronización automática como en la manual. Las reseñas que ya tienen respuesta en Google no se tocan.",
  },
  {
    route: AUTOMATION,
    target: "automation-new",
    title: "Regla: acción",
    description: `Con este botón creas una regla. Primero eliges qué hace:
    <ul>
      <li><b>Responder automáticamente con IA:</b> genera la respuesta y la publica en Google sin revisión.</li>
      <li><b>Generar borrador con IA:</b> la deja preparada para que la revises en Reseñas.</li>
      <li><b>Notificar por Telegram:</b> te avisa en tu chat. Requiere configurar Telegram.</li>
      <li><b>Notificar por WhatsApp:</b> próximamente, aún no envía mensajes.</li>
    </ul>`,
  },
  {
    route: AUTOMATION,
    target: "automation-new",
    title: "Regla: condiciones",
    description: `Deciden a qué reseñas se aplica:
    <ul>
      <li><b>Rating mínimo y máximo:</b> el rango de estrellas.</li>
      <li><b>Idiomas:</b> solo reseñas en esos idiomas. Es opcional.</li>
      <li><b>Palabras clave:</b> el comentario debe contener alguna, separadas por comas.</li>
      <li><b>Solo reseñas con comentario:</b> ignora las que solo tienen estrellas.</li>
    </ul>`,
  },
  {
    route: AUTOMATION,
    target: "automation-new",
    title: "Regla: otros campos",
    description: `<ul>
      <li><b>Nombre y descripción:</b> para reconocer la regla. Solo el nombre es obligatorio.</li>
      <li><b>Retraso:</b> el valor se guarda, pero por ahora la regla se ejecuta de inmediato.</li>
    </ul>`,
  },
  {
    route: AUTOMATION,
    target: "automation-rule-controls",
    title: "Gestionar una regla",
    description: `En cada regla creada:
    <ul>
      <li><b>Activar / Desactivar:</b> la pausa sin borrarla.</li>
      <li><b>Lápiz:</b> edita la regla.</li>
      <li><b>Papelera:</b> la elimina.</li>
    </ul>`,
  },

  // Analíticas
  {
    route: ANALYTICS,
    target: "nav-analytics",
    title: "Analíticas",
    description: "Cómo evolucionan tus reseñas a lo largo del tiempo.",
  },
  {
    route: ANALYTICS,
    target: "analytics-range",
    title: "Rango de fechas",
    description:
      "Elige <b>Desde</b> y <b>Hasta</b> y pulsa <b>Aplicar</b>, o usa un atajo: 30 días, 3 meses, 12 meses o Todo. Toda la página se actualiza con ese rango.",
  },
  {
    route: ANALYTICS,
    target: "analytics-metrics",
    title: "Métricas del periodo",
    description: "Las cifras de reseñas, valoración y respuestas dentro del rango elegido.",
  },
  {
    route: ANALYTICS,
    target: "analytics-charts",
    title: "Gráficos",
    description:
      "<b>Reseñas por periodo</b> muestra cuántas llegan con el tiempo. Más abajo, <b>Distribución por estrellas</b> las reparte por valoración. Pasa el cursor para ver cada valor.",
  },

  // Actividad
  {
    route: ACTIVITY,
    target: "nav-activity",
    title: "Actividad",
    description: "El registro de todo lo que ocurre en tu cuenta.",
  },
  {
    route: ACTIVITY,
    target: "activity-filters",
    title: "Filtros",
    description:
      "Filtra por <b>categoría</b> (reseñas, respuestas, automatizaciones, sincronización, configuración y cuenta) y por <b>estado</b> (correctas, fallidas, omitidas o informativas).",
  },
  {
    route: ACTIVITY,
    target: "activity-log",
    title: "Cada entrada",
    description:
      "Indica qué pasó, cuándo y quién lo hizo: un usuario, o <b>Sistema</b> si fue una acción automática.",
  },

  // Configuración
  {
    route: SETTINGS,
    target: "nav-settings",
    title: "Configuración",
    description: "Las conexiones que hacen funcionar todo lo anterior. Empieza por aquí.",
  },
  {
    route: SETTINGS,
    target: "settings-business",
    title: "Información del Negocio",
    description: `<ul>
      <li><b>Nombre:</b> el nombre de tu negocio en la aplicación.</li>
      <li><b>Plan:</b> tu plan actual.</li>
    </ul>`,
  },
  {
    route: SETTINGS,
    target: "settings-google",
    title: "Google Business Profile",
    description: `Aquí tienes los pasos para solicitar a Google el acceso a su API, imprescindible para leer tus reseñas.
    <ul>
      <li><b>Client ID y Client Secret:</b> las credenciales OAuth de tu proyecto de Google Cloud.</li>
      <li><b>Conectar Cuenta:</b> autoriza a la aplicación a usar tu perfil. Guarda antes las credenciales.</li>
    </ul>`,
  },
  {
    route: SETTINGS,
    target: "settings-ai",
    title: "Inteligencia Artificial",
    description: `<ul>
      <li><b>Anthropic API Key:</b> necesaria para generar respuestas.</li>
      <li><b>Modelo:</b> el modelo de Claude que se usa.</li>
      <li><b>Tono por defecto:</b> profesional, amigable o empático.</li>
      <li><b>Contexto del negocio:</b> datos que la IA tiene en cuenta al responder.</li>
      <li><b>Prompt personalizado:</b> sustituye las instrucciones por defecto. Solo se aplica al generar desde Reseñas, no en las automatizaciones.</li>
    </ul>`,
  },
  {
    route: SETTINGS,
    target: "settings-telegram",
    title: "Telegram Bot",
    description: `Para las reglas que notifican por Telegram.
    <ul>
      <li><b>Bot Token:</b> te lo da @BotFather al crear el bot.</li>
      <li><b>Chat ID:</b> el chat donde recibirás los avisos.</li>
    </ul>`,
  },
  {
    route: SETTINGS,
    target: "settings-whatsapp",
    title: "WhatsApp (Evolution API)",
    description: `Próximamente: puedes guardar los datos, pero aún no se envían mensajes.
    <ul>
      <li><b>Evolution API URL:</b> la dirección de tu servidor.</li>
      <li><b>API Key:</b> la clave de ese servidor.</li>
    </ul>`,
  },
  {
    route: SETTINGS,
    target: "settings-save",
    title: "Guardar Configuración",
    description: "Guarda todos los bloques anteriores. Si no lo pulsas, los cambios se pierden.",
  },
  {
    route: SETTINGS,
    target: "settings-security",
    title: "Seguridad",
    description:
      "Cambia tu contraseña indicando la actual y la nueva dos veces, con un mínimo de 8 caracteres. Tiene su propio botón.",
  },
  {
    route: SETTINGS,
    target: "tour-restart",
    title: "¡Listo!",
    description: "Puedes repetir este tour cuando quieras desde aquí.",
  },
];
