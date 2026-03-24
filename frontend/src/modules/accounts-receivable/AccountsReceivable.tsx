import {
  Card,
  Modal,
  InputNumber,
  Input,
  message,
  Select,
  Checkbox,
} from "antd";
import { useState } from "react";
import { useAccountReceivable } from "./useAccountReceivable";
import { formatCurrency } from "../../core/utils/formatters";
import { useCustomers } from "../customers/useCustomers";
import PageHeader from "../../core/components/common/PageHeader";
import FinancialAccountsTable from "../../core/components/table/FinancialAccountsTable";

export default function AccountsReceivable() {
  const { data, loading, pay, reload } =
    useAccountReceivable();

  const { customers } = useCustomers();

  const [filters, setFilters] = useState<{
    status?: string;
    customerId?: number;
    overdue?: boolean;
  }>({});

  const [selected, setSelected] =
    useState<any>(null);

  const [amount, setAmount] =
    useState<number>(0);

  const [note, setNote] =
    useState<string>();

  function handleFilterChange(newFilters: typeof filters) {
    setFilters(newFilters);
    reload(newFilters);
  }

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
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 160 }}
            onChange={(value) =>
              handleFilterChange({ ...filters, status: value })
            }
            options={[
              { label: "Pendiente", value: "PENDING" },
              { label: "Parcial",   value: "PARTIAL" },
              { label: "Pagado",    value: "PAID" },
            ]}
          />

          <Select
            allowClear
            showSearch                        
            placeholder="Cliente"
            style={{ width: 220 }}
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={(value) =>
              handleFilterChange({ ...filters, customerId: value })
            }
            options={customers.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
          />

          <Checkbox
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                overdue: e.target.checked || undefined,
              })
            }
          >
            Solo vencidas
          </Checkbox>

        </div>

        <FinancialAccountsTable
          data={data}
          loading={loading}
          type="receivable"
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