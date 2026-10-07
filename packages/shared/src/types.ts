export interface ReviewFilters {
  locationId?: string;
  starRatings?: number[];
  hasReply?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AutomationConditions {
  starRatings?: number[];
  languages?: string[];
  keywords?: string[];
  locationIds?: string[];
}

export type Tone = "professional" | "friendly" | "apologetic";

export interface GenerateReplyRequest {
  reviewId: string;
  tone: Tone;
  customInstructions?: string;
}

export interface GenerateReplyResponse {
  reply: string;
  detectedLanguage: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface NotificationPayload {
  type: "new_review" | "negative_review" | "reply_sent";
  reviewId: string;
  locationId: string;
  tenantId: string;
  data: {
    reviewerName: string;
    starRating: number;
    comment?: string;
    locationName: string;
  };
}
