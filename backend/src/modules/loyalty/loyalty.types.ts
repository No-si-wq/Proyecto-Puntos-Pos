export interface LoyaltyConfig {
  earn: {
    enabled: boolean;
    amountPerPoint: number;
    minSaleAmount?: number;
  };
  redeem: {
    enabled: boolean;
    pointValue: number;
    maxPercentagePerSale: number;
  };
}
