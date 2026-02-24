import { Button } from "antd";
import { formatCurrency } from "../../utils/formatters";

interface Props {
  subtotal: number;
  pointsUsed?: number;
  disabled: boolean;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function MobileBottomBar({
  subtotal,
  pointsUsed = 0,
  disabled,
  loading,
  onConfirm,
}: Props) {
  const discount = pointsUsed ?? 0;
  const total = subtotal - discount;
  
  return (
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        transform: total > 0 ? "scale(1.02)" : "scale(1)",
        transition: "all 0.15s ease",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        padding: "14px 16px",
        paddingBottom:
          "calc(14px + env(safe-area-inset-bottom))",
        boxShadow:
          "0 -4px 12px rgba(0,0,0,0.06)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#888",
            letterSpacing: 1,
          }}
        >
          TOTAL A PAGAR
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            transition:
              "transform 0.15s ease",
          }}
        >
          {formatCurrency(total)}
        </div>
      </div>

      <Button
        type="primary"
        block
        size="large"
        disabled={disabled}
        loading={loading}
        style={{
          height: 48,
          fontWeight: 600,
        }}
        onClick={onConfirm}
      >
        Confirmar venta
      </Button>
    </div>
  );
}