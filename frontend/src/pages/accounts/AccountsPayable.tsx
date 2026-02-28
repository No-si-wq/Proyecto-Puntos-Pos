import {
  Card,
  Modal,
  InputNumber,
  Input,
  message,
} from "antd";
import { useState } from "react";
import { useAccountPayable } from "../../hooks/useAccountPayable";
import { formatCurrency } from "../../utils/formatters";
import PageHeader from "../../components/common/PageHeader";
import FinancialAccountsTable from "../../components/tables/FinancialAccountsTable";

export default function AccountsPayable() {
  const { data, loading, pay } =
    useAccountPayable();

  const [selected, setSelected] =
    useState<any>(null);

  const [amount, setAmount] =
    useState<number>(0);

  const [note, setNote] =
    useState<string>();

  async function handlePayment() {
    if (!amount || amount <= 0) {
      message.error("Monto inválido");
      return;
    }

    await pay(selected.id, amount, note);
    message.success("Pago registrado");
    setSelected(null);
    setAmount(0);
    setNote(undefined);
  }

  return (
    <>
      <PageHeader
        title="Cuentas por Pagar"
        subtitle="Gestión de deudas con proveedores"
      />

      <Card>
        <FinancialAccountsTable
          data={data}
          loading={loading}
          type="payable"
          onPay={(record) => setSelected(record)}
        />
      </Card>

      <Modal
        open={!!selected}
        title="Registrar Pago"
        onCancel={() =>
          setSelected(null)
        }
        onOk={handlePayment}
      >
        <div style={{ marginBottom: 12 }}>
          Saldo actual:{" "}
          <strong>
            {formatCurrency(
              selected?.balance ?? 0
            )}
          </strong>
        </div>

        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={selected?.balance}
          value={amount}
          onChange={(v) =>
            setAmount(Number(v))
          }
          placeholder="Monto a pagar"
        />

        <Input
          style={{ marginTop: 12 }}
          value={note}
          onChange={(e) =>
            setNote(e.target.value)
          }
          placeholder="Nota (opcional)"
        />
      </Modal>
    </>
  );
}