import prisma from "../../core/prisma";
import { LoyaltyConfig } from "./loyalty.types";

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  earn: {
    enabled: true,
    amountPerPoint: 1,
  },
  redeem: {
    enabled: true,
    pointValue: 0.01,
  },
};

export async function getLoyaltyConfig(tenantId: number): Promise<LoyaltyConfig> {
  const record = await prisma.systemConfig.findUnique({
    where: { tenantId_key: { tenantId, key: "loyalty_config" } },
  });

  if (!record) return DEFAULT_LOYALTY_CONFIG;

  try {
    return JSON.parse(record.value) as LoyaltyConfig;
  } catch {
    return DEFAULT_LOYALTY_CONFIG;
  }
}