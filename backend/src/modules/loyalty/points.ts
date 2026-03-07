export interface UsePointsResult {
  pointsUsed: number;
  discountApplied: number;
}

export enum LoyaltyError {
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
  POINTS_DISABLED = "POINTS_DISABLED",
}