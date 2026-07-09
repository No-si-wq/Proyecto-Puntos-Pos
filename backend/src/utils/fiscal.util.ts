export interface FiscalNumberParts {
  establishment: string;   // "001"
  emissionPoint: string;   // "001"
  documentType: string;    // "01"
  sequence: number | bigint;
}

export function buildFiscalNumber(parts: FiscalNumberParts): string {
  const seq = String(parts.sequence).padStart(8, '0');
  return `${parts.establishment}-${parts.emissionPoint}-${parts.documentType}-${seq}`;
}

export function extractSequence(fiscalNumber: string): bigint {
  const parts = fiscalNumber.split("-");
  return BigInt(parts[parts.length - 1]);
}

export function validateFiscalRange(
  number: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  const toInt = (n: string) => parseInt(n.replace(/-/g, ''), 10);
  return toInt(number) >= toInt(rangeStart) && toInt(number) <= toInt(rangeEnd);
}

export function isFiscalConfigExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// Agregar al archivo existente (junto a buildFiscalNumber, validateFiscalRange, etc.)
import { Prisma } from "@prisma/client";
import { SaleError } from "../modules/sale/sale"; // ajusta la ruta relativa según donde viva este util

interface ResolveSaleNumberParams {
  tenantId: number;
  warehouseId: number;
  sellerId?: number | null;
}

export async function resolveSaleNumber(
  tx: Prisma.TransactionClient,
  { tenantId, warehouseId, sellerId }: ResolveSaleNumberParams
) {
  // 1. Folio del vendedor primero; si no tiene uno propio, el general del tenant
  const fiscalConfig =
    (sellerId
      ? await tx.fiscalConfig.findFirst({ where: { tenantId, active: true, userId: sellerId } })
      : null) ??
    (await tx.fiscalConfig.findFirst({ where: { tenantId, active: true, userId: null } }));

  if (fiscalConfig && isFiscalConfigExpired(fiscalConfig.expiresAt)) {
    throw new Error(SaleError.FISCAL_CONFIG_EXPIRED);
  }

  const usesUserSequence = !!fiscalConfig?.userId;

  // 1.1 Alinear secuencia si el CAI autoriza un rango que arranca más adelante
  if (fiscalConfig) {
    const rangeStartSeq = extractSequence(fiscalConfig.rangeStart);

    if (usesUserSequence) {
      const existing = await tx.userSaleSequence.findUnique({ where: { userId: fiscalConfig.userId! } });
      if (!existing || existing.current < rangeStartSeq - 1n) {
        await tx.userSaleSequence.upsert({
          where: { userId: fiscalConfig.userId! },
          update: { current: rangeStartSeq - 1n },
          create: { tenantId, userId: fiscalConfig.userId!, current: rangeStartSeq - 1n },
        });
      }
    } else {
      const existing = await tx.saleSequence.findUnique({ where: { warehouseId } });
      if (!existing || existing.current < rangeStartSeq - 1n) {
        await tx.saleSequence.upsert({
          where: { warehouseId },
          update: { current: rangeStartSeq - 1n },
          create: { tenantId, warehouseId, current: rangeStartSeq - 1n },
        });
      }
    }
  }

  // 2. La secuencia siempre incrementa (con o sin CAI)
  const sequence = usesUserSequence
    ? await tx.userSaleSequence.upsert({
        where: { userId: fiscalConfig!.userId! },
        update: { current: { increment: 1 } },
        create: { tenantId, userId: fiscalConfig!.userId!, current: 1 },
      })
    : await tx.saleSequence.upsert({
        where: { warehouseId },
        update: { current: { increment: 1 } },
        create: { tenantId, warehouseId, current: 1 },
      });

  // 3. Construir número según si hay CAI o no
  let saleNumber: string;

  if (fiscalConfig) {
    saleNumber = buildFiscalNumber({
      establishment: fiscalConfig.establishment,
      emissionPoint: fiscalConfig.emissionPoint,
      documentType: fiscalConfig.documentType,
      sequence: sequence.current,
    });

    if (!validateFiscalRange(saleNumber, fiscalConfig.rangeStart, fiscalConfig.rangeEnd)) {
      throw new Error(SaleError.FISCAL_RANGE_EXCEEDED);
    }
  } else {
    saleNumber = `FAC-${String(warehouseId).padStart(3, "0")}-${String(sequence.current).padStart(8, "0")}`;
  }

  return { saleNumber, fiscalConfig };
}