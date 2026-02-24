import { LoyaltyConfig } from "./loyalty.types";

export const LOYALTY_CONFIG: LoyaltyConfig = {
  earn: {
    enabled: true,
    amountPerPoint: 10,
    minSaleAmount: 10,
  },
  redeem: {
    enabled: true,
    pointValue: 1,
    maxPercentagePerSale: 0.5,
  },
};