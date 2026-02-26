import {
  Card,
  Tag,
  Button,
  Modal,
  InputNumber,
  Input,
  message,
} from "antd";
import { useState } from "react";
import { useAccountReceivable } from "../../hooks/useAccountReceivable";
import { formatCurrency } from "../../utils/formatters";
import PageHeader from "../../components/common/PageHeader";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import SimpleTable from "../../components/tables/SimpleTable";

export default function AccountsReceivable() {
  const { data, loading, pay } =
    useAccountReceivable();

  const sizes = useResponsiveSizes();

  const [selected, setSelected] =
    useState<any>(null);

  const [amount, setAmount] =
    useState<number>(0);

  const [note, setNote] =
    useState<string>();

  const isOverdue = (record: any) =>
    record.status !== "PAID" &&
    record.dueDate &&
    new Date(record.dueDate) <
      new Date();

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
        title="Cuentas por Cobrar"
        subtitle="Gestión de créditos de clientes"
      />

      <Card>
        <SimpleTable
          loading={loading}
          data={data}
          columns={[
            {
              title: "Cliente",
              dataIndex: ["customer", "name"],
            },
            {
              title: "Total",
              render: (_, r) =>
                formatCurrency(r.total),
            },
            {
              title: "Saldo",
              render: (_, r) =>
                formatCurrency(r.balance),
            },
            {
              title: "Vence",
              render: (_, r) =>
                r.dueDate
                  ? new Date(
                      r.dueDate
                    ).toLocaleDateString()
                  : "-",
            },
            {
              title: "Estado",
              render: (_, r) => {
                if (r.status === "PAID")
                  return (
                    <Tag color="green">
                      PAGADA
                    </Tag>
                  );

                if (isOverdue(r))
                  return (
                    <Tag color="red">
                      VENCIDA
                    </Tag>
                  );

                return (
                  <Tag color="orange">
                    {r.status}
                  </Tag>
                );
              },
            },
            {
              title: "Acción",
              render: (_, r) =>
                r.status !== "PAID" && (
                  <Button
                    size={sizes.button}
                    onClick={() =>
                      setSelected(r)
                    }
                  >
                    Registrar Pago
                  </Button>
                ),
            },
          ]}
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