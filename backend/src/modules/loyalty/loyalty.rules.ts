import { LoyaltyConfig } from "./loyalty.types";

export const LOYALTY_CONFIG: LoyaltyConfig = {
  earn: {
    enabled: true,
    amountPerPoint: 1,
    minSaleAmount: 10,
  },
  redeem: {
    enabled: true,
    pointValue: 0.01,
  },
};