export function detectLanguage(text: string): string {
  if (!text) return "unknown";

  const spanishPatterns = /\b(el|la|los|las|de|que|en|un|una|es|por|con|para|del|al|como|más|pero|sus|le|ya|o|porque|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|tu|mi|te|ti|tus|ellas|nosotras|vosotros|vosotras|vuestro|vuestra|vuestros|vuestras|nos|les|se|sí|si|así|bueno|malo|bien|mal)\b/gi;

  const englishPatterns = /\b(the|be|to|of|and|a|in|that|have|i|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us|very|best)\b/gi;

  const portuguesePatterns = /\b(o|a|os|as|de|da|do|dos|das|em|na|no|nos|nas|um|uma|uns|umas|que|é|para|por|com|como|mas|mais|ou|se|já|também|não|muito|bem|só|foi|ser|ter|seu|sua|seus|suas|ele|ela|eles|elas|nós|você|vocês|meu|minha|meus|minhas|teu|tua|teus|tuas|nosso|nossa|nossos|nossas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas|isto|isso|aquilo|quem|qual|quais|onde|quando|porque|porquê)\b/gi;

  const spanishCount = (text.match(spanishPatterns) || []).length;
  const englishCount = (text.match(englishPatterns) || []).length;
  const portugueseCount = (text.match(portuguesePatterns) || []).length;

  const maxCount = Math.max(spanishCount, englishCount, portugueseCount);

  if (maxCount === 0) return "unknown";
  if (maxCount === spanishCount) return "es";
  if (maxCount === englishCount) return "en";
  if (maxCount === portugueseCount) return "pt";

  return "unknown";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function formatStarRating(rating: number): string {
  return "⭐".repeat(rating);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatDate(date: Date, locale = "es-ES"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatRelativeTime(date: Date, locale = "es-ES"): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  const intervals = [
    { unit: "year" as const, seconds: 31536000 },
    { unit: "month" as const, seconds: 2592000 },
    { unit: "week" as const, seconds: 604800 },
    { unit: "day" as const, seconds: 86400 },
    { unit: "hour" as const, seconds: 3600 },
    { unit: "minute" as const, seconds: 60 },
  ];

  for (const { unit, seconds } of intervals) {
    const diff = Math.floor(diffInSeconds / seconds);
    if (Math.abs(diff) >= 1) {
      return rtf.format(diff, unit);
    }
  }

  return rtf.format(Math.floor(diffInSeconds), "second");
}

export function calculateAverageRating(
  ratings: { rating: number; count: number }[]
): number {
  const total = ratings.reduce((sum, r) => sum + r.rating * r.count, 0);
  const count = ratings.reduce((sum, r) => sum + r.count, 0);
  return count > 0 ? total / count : 0;
}
