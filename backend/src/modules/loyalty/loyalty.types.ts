export interface LoyaltyConfig {
  earn: {
    enabled: boolean;
    amountPerPoint: number;
  };
  redeem: {
    enabled: boolean;
    pointValue: number;
  };
}
