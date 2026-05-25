import { useRef, useCallback, useEffect } from "react";
import { message } from "antd";
import type { Product } from "../../modules/products/types/product";
import { useProducts } from "../../modules/products/hooks/useProducts";
import { parseScannedCode } from "../utils/parseScannedCode";

interface UseBarcodeScannerOptions {
  onProductFound: (
    product: Product,
    meta?: {
      lot?: string;
      expiresAt?: Date;
    }
  ) => void;
  delay?: number;
}

export function useBarcodeScanner({
  onProductFound,
  delay = 40,
}: UseBarcodeScannerOptions) {
  const { findByBarcode } = useProducts();

  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanningRef = useRef(false);

  const processBuffer = useCallback(async () => {
    const raw = bufferRef.current.trim();
    bufferRef.current = "";

    if (!raw || scanningRef.current) return;

    const code = parseScannedCode(raw);

    if (!code) {
      message.error("Codigo QR no valido");
      return;
    }

    scanningRef.current = true;

    try {
      const product = await findByBarcode(code.barcode);

      if (!product) {
        message.error("Producto no encontrado");
        return;
      }

      onProductFound(product, {
        lot: code.lot,
        expiresAt: code.expiresAt,
      });
    } finally {
      scanningRef.current = false;
    }
  }, [findByBarcode, onProductFound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el foco está en un input/select/textarea, ignorar
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        if (timerRef.current) clearTimeout(timerRef.current);
        processBuffer();
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(processBuffer, delay);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processBuffer, delay]);

  return {};
}