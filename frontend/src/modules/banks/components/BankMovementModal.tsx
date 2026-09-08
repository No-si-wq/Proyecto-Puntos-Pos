import { useState } from "react";
import { Modal, InputNumber, Input, Select, message } from "antd";
import { formatCurrency } from "../../../core/utils/formatters";
import type { Bank, BankMovementInput } from "../types/bank";

interface Props {
  bank: Bank | null;
  onClose: () => void;
  onSubmit: (data: BankMovementInput) => Promise<void>;
}

export default function BankMovementModal({ bank, onClose, onSubmit }: Props) {
  const [type, setType] = useState<"DEPOSIT" | "WITHDRAWAL">("DEPOSIT");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>();
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setType("DEPOSIT");
    setAmount(0);
    setDescription(undefined);
    onClose();
  }

  async function handleOk() {
    if (!amount || amount <= 0) {
      message.error("Monto inválido");
      return;
    }

    if (type === "WITHDRAWAL" && bank && amount > bank.balance) {
      message.error("El monto excede el saldo disponible");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ type, amount, description });
      message.success(
        type === "DEPOSIT" ? "Depósito registrado" : "Retiro registrado"
      );
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={!!bank}
      title="Registrar Movimiento"
      onCancel={handleClose}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 12 }}>
        Saldo actual: <strong>{formatCurrency(bank?.balance ?? 0)}</strong>
      </div>

      <Select
        style={{ width: "100%", marginBottom: 12 }}
        value={type}
        onChange={setType}
        options={[
          { label: "Depósito", value: "DEPOSIT" },
          { label: "Retiro", value: "WITHDRAWAL" },
        ]}
      />

      <InputNumber
        style={{ width: "100%" }}
        min={0}
        max={type === "WITHDRAWAL" ? bank?.balance : undefined}
        value={amount}
        onChange={(v) => setAmount(Number(v))}
        placeholder="Monto"
      />

      <Input
        style={{ marginTop: 12 }}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
      />
    </Modal>
  );
}