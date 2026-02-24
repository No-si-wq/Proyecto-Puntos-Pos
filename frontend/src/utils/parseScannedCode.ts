export interface ParsedScan {
  barcode: string;
  lot?: string;
  expiresAt?: Date;
}

export function parseScannedCode(raw: string): ParsedScan | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^\d{6,}$/.test(value)) {
    return { barcode: value };
  }

  try {
    const parsed = JSON.parse(value);

    if (typeof parsed.barcode !== "string") return null;

    return {
      barcode: parsed.barcode,
      lot:
        typeof parsed.lot === "string"
          ? parsed.lot
          : undefined,
      expiresAt: parsed.expiresAt
        ? new Date(parsed.expiresAt)
        : undefined,
    };
  } catch {
    return null;
  }
}