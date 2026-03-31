import {
  Card,
  Modal,
  InputNumber,
  Input,
  message,
  Select,
  Checkbox,
  Row,
  Col,
} from "antd";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAccountPayable } from "./useAccountPayable";
import { formatCurrency } from "../../core/utils/formatters";
import PageHeader from "../../core/components/common/PageHeader";
import FinancialAccountsTable from "../../core/components/table/FinancialAccountsTable";
import { useSuppliers } from "../suppliers/useSuppliers";

export default function AccountsPayable() {
  const { data, loading, pay, reload } =
    useAccountPayable();

  const { suppliers, loading: loadingSuppliers, setFilters: setFiltersSuppliers } = useSuppliers();

  const [selected, setSelected] =
    useState<any>(null);

  const [filters, setFilters] = useState<{
    status?: string;
    supplierId?: number;
    overdue?: boolean;
  }>({});

  const [amount, setAmount] =
    useState<number>(0);

  const [note, setNote] =
    useState<string>();

  const handleSearch = useDebouncedCallback((value: string) => {
    setFiltersSuppliers({ search: value });
  }, 400);

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
        title="Cuentas por Pagar"
        subtitle="Gestión de deudas con proveedores"
      />

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} md={6}>
            <Select
              allowClear
              placeholder="Estado"
              style={{ width: "100%" }}
              onChange={(value) =>
                handleFilterChange({ ...filters, status: value })
              }
              options={[
                { label: "Pendiente", value: "PENDING" },
                { label: "Parcial", value: "PARTIAL" },
                { label: "Pagado", value: "PAID" },
              ]}
            />
          </Col>
 
          <Col xs={12} sm={10} md={8}>
            <Select
              allowClear
              showSearch
              placeholder="Proveedor"
              style={{ width: "100%" }}
              loading={loadingSuppliers}
              filterOption={false}
              onSearch={handleSearch}
              onChange={(value) =>
                handleFilterChange({ ...filters, supplierId: value })
              }
              options={suppliers.map((s) => ({
                label: s.name,
                value: s.id,
              }))}
            />
          </Col>
 
          <Col xs={24} sm="auto">
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
          </Col>
        </Row>

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