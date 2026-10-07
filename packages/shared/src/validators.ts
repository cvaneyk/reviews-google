import { z } from "zod";

export const reviewFiltersSchema = z.object({
  locationId: z.string().optional(),
  starRatings: z.array(z.number().min(1).max(5)).optional(),
  hasReply: z.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const generateReplySchema = z.object({
  reviewId: z.string(),
  tone: z.enum(["professional", "friendly", "apologetic"]),
  customInstructions: z.string().max(500).optional(),
});

export const automationConditionsSchema = z.object({
  starRatings: z.array(z.number().min(1).max(5)).optional(),
  languages: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
});

export const createAutomationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  conditions: automationConditionsSchema,
  action: z.enum([
    "AUTO_REPLY",
    "NOTIFY_TELEGRAM",
    "NOTIFY_WHATSAPP",
    "GENERATE_AI_REPLY",
  ]),
  templateId: z.string().optional(),
  delayMinutes: z.number().min(0).default(0),
  locationId: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  language: z.string().default("es"),
  category: z.enum([
    "POSITIVE_5_STAR",
    "POSITIVE_4_STAR",
    "NEUTRAL_3_STAR",
    "NEGATIVE_2_STAR",
    "NEGATIVE_1_STAR",
    "GENERIC",
  ]),
  content: z.string().min(1).max(2000),
  isAiBase: z.boolean().default(false),
});

export const notificationConfigSchema = z.object({
  channel: z.enum(["TELEGRAM", "WHATSAPP", "EMAIL", "SLACK"]),
  isActive: z.boolean().default(true),
  config: z.record(z.unknown()),
  notifyOn: z.object({
    newReview: z.boolean().default(true),
    negativeReview: z.boolean().default(true),
    starRatings: z.array(z.number().min(1).max(5)).optional(),
  }),
});

export type ReviewFiltersInput = z.infer<typeof reviewFiltersSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type GenerateReplyInput = z.infer<typeof generateReplySchema>;
export type CreateAutomationRuleInput = z.infer<
  typeof createAutomationRuleSchema
>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>;
