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