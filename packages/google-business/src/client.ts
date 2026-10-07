import { google } from "googleapis";
import type {
  GoogleReview,
  GoogleLocation,
  GoogleAccount,
  ReviewsListResponse,
  LocationsListResponse,
  AccountsListResponse,
} from "./types";
import { createOAuth2Client } from "./auth";

export class GoogleBusinessClient {
  private oauth2Client;

  constructor(accessToken: string, refreshToken: string) {
    this.oauth2Client = createOAuth2Client();
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async listAccounts(): Promise<AccountsListResponse> {
    const mybusiness = google.mybusinessaccountmanagement({
      version: "v1",
      auth: this.oauth2Client,
    });

    const response = await mybusiness.accounts.list();

    return {
      accounts: (response.data.accounts || []) as GoogleAccount[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  async listLocations(accountId: string): Promise<LocationsListResponse> {
    const mybusiness = google.mybusinessbusinessinformation({
      version: "v1",
      auth: this.oauth2Client,
    });

    const response = await mybusiness.accounts.locations.list({
      parent: `accounts/${accountId}`,
      readMask: "name,title,storefrontAddress,phoneNumbers,websiteUri",
    });

    return {
      locations: (response.data.locations || []) as GoogleLocation[],
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  async listReviews(
    locationName: string,
    pageToken?: string,
    pageSize = 50
  ): Promise<ReviewsListResponse> {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}${
        pageToken ? `&pageToken=${pageToken}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${this.oauth2Client.credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      reviews: (data.reviews || []) as GoogleReview[],
      nextPageToken: data.nextPageToken,
      totalReviewCount: data.totalReviewCount,
      averageRating: data.averageRating,
    };
  }

  async replyToReview(reviewName: string, comment: string): Promise<void> {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.oauth2Client.credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to reply to review: ${JSON.stringify(error)}`);
    }
  }

  async deleteReply(reviewName: string): Promise<void> {
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.oauth2Client.credentials.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete reply: ${response.statusText}`);
    }
  }
}
