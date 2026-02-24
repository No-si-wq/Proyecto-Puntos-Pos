export interface UsePointsResult {
  pointsUsed: number;
  discountApplied: number;
}

export enum LoyaltyError {
  INSUFFICIENT_POINTS = "INSUFFICIENT_POINTS",
  POINTS_DISABLED = "POINTS_DISABLED",
}