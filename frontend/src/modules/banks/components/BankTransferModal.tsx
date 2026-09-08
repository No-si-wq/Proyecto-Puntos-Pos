import { useState } from "react";
import { Modal, InputNumber, Input, Select, message } from "antd";
import { formatCurrency } from "../../../core/utils/formatters";
import type { Bank, BankTransferInput } from "../types/bank";

interface Props {
  open: boolean;
  banks: Bank[];
  defaultFromBankId?: number;
  onClose: () => void;
  onSubmit: (data: BankTransferInput) => Promise<void>;
}

export default function BankTransferModal({
  open,
  banks,
  defaultFromBankId,
  onClose,
  onSubmit,
}: Props) {
  const [fromBankId, setFromBankId] = useState<number | undefined>(
    defaultFromBankId
  );
  const [toBankId, setToBankId] = useState<number>();
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>();
  const [loading, setLoading] = useState(false);

  const fromBank = banks.find((b) => b.id === fromBankId);

  function handleClose() {
    setFromBankId(defaultFromBankId);
    setToBankId(undefined);
    setAmount(0);
    setDescription(undefined);
    onClose();
  }

  async function handleOk() {
    if (!fromBankId || !toBankId) {
      message.error("Selecciona ambas cuentas");
      return;
    }

    if (fromBankId === toBankId) {
      message.error("La cuenta de origen y destino no pueden ser la misma");
      return;
    }

    if (!amount || amount <= 0) {
      message.error("Monto inválido");
      return;
    }

    if (fromBank && amount > fromBank.balance) {
      message.error(
        "El monto excede el saldo disponible en la cuenta de origen"
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ fromBankId, toBankId, amount, description });
      message.success("Transferencia realizada");
      handleClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Transferencia entre Cuentas"
      onCancel={handleClose}
      onOk={handleOk}
      confirmLoading={loading}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 4 }}>Cuenta origen</div>
        <Select
          style={{ width: "100%" }}
          value={fromBankId}
          onChange={setFromBankId}
          placeholder="Selecciona la cuenta de origen"
          options={banks
            .filter((b) => b.active)
            .map((b) => ({
              label: `${b.name} (${b.currency})`,
              value: b.id,
            }))}
        />
        {fromBank && (
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            Saldo disponible: {formatCurrency(fromBank.balance)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 4 }}>Cuenta destino</div>
        <Select
          style={{ width: "100%" }}
          value={toBankId}
          onChange={setToBankId}
          placeholder="Selecciona la cuenta de destino"
          options={banks
            .filter((b) => b.active && b.id !== fromBankId)
            .map((b) => ({
              label: `${b.name} (${b.currency})`,
              value: b.id,
            }))}
        />
      </div>

      <InputNumber
        style={{ width: "100%" }}
        min={0}
        max={fromBank?.balance}
        value={amount}
        onChange={(v) => setAmount(Number(v))}
        placeholder="Monto a transferir"
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