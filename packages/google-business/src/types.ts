export interface GoogleReview {
  name: string;
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleLocation {
  name: string;
  locationName: string;
  title: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  phoneNumbers?: {
    primaryPhone?: string;
  };
  websiteUri?: string;
}

export interface GoogleAccount {
  name: string;
  accountName: string;
  type: string;
}

export interface ReviewsListResponse {
  reviews: GoogleReview[];
  nextPageToken?: string;
  totalReviewCount?: number;
  averageRating?: number;
}

export interface LocationsListResponse {
  locations: GoogleLocation[];
  nextPageToken?: string;
}

export interface AccountsListResponse {
  accounts: GoogleAccount[];
  nextPageToken?: string;
}

export function starRatingToNumber(
  rating: GoogleReview["starRating"]
): number {
  const map = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return map[rating];
}

export function numberToStarRating(
  num: number
): GoogleReview["starRating"] {
  const map: Record<number, GoogleReview["starRating"]> = {
    1: "ONE",
    2: "TWO",
    3: "THREE",
    4: "FOUR",
    5: "FIVE",
  };
  return map[num] || "THREE";
}
