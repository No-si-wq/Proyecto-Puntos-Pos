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
  Button,
  Dropdown,
  Tag,
  type MenuProps,
} from "antd";
import { DownOutlined } from "@ant-design/icons"
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAccountReceivable } from "./useAccountReceivable";
import { formatCurrency } from "../../core/utils/formatters";
import { useCustomers } from "../customers/useCustomers";
import PageHeader from "../../core/components/common/PageHeader";
import FinancialAccountsTable from "../../core/components/table/FinancialAccountsTable";
import { useBanks } from "../banks/hooks/useBanks";
import { useReportTemplates } from "../report-templates/hooks/useReportTemplates";
import { resolvePaymentTemplate, type PaymentForPrint } from "../report-templates/utils/resolvePaymentTemplate";

export default function AccountsReceivable() {
  const { data, loading, pay, reload } =
    useAccountReceivable();

  const { customers, loading: loadingCustomers, setFilters: setFiltersCustomer } = useCustomers();

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

  const [bankId, setBankId] =
    useState<number>();

  const [ticketResult, setTicketResult] =
    useState<any>(null);

  const { data: banks } = useBanks();
  const { templates, getDefaultByType, getById: getTemplateById } = useReportTemplates();
  const [paymentTemplateConfig, setPaymentTemplateConfig] = useState<any>(null);

  useEffect(() => {
    let ignore = false;
    getDefaultByType("receivable_payment").then(t => {
      if (!ignore && t) setPaymentTemplateConfig(t.config);
    });
    return () => { ignore = true; };
  }, []);

  async function fetchPaymentTemplate() {
    const t = await getDefaultByType("receivable_payment");
    setPaymentTemplateConfig(t?.config ?? null);
    return t?.config ?? null;
  }

  const handleSearch = useDebouncedCallback((value: string) => {
    setFiltersCustomer({ search: value });
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

    const result = await pay(selected.id, amount, note, bankId);
    message.success("Pago registrado");
    result.bankName = banks.find(b => b.id === bankId)?.name ?? null;
    setSelected(null);
    setAmount(0);
    setNote(undefined);
    setBankId(undefined);
    await fetchPaymentTemplate();
    setTicketResult(result); // <-- abre el modal de previsualización en vez de imprimir directo
  }

  async function printReceivableTicket(result: PaymentForPrint, templateId?: number) {
    let config;
    if (templateId) {
      const t = await getTemplateById(templateId);
      config = t.config;
    } else {
      config = paymentTemplateConfig ?? (await fetchPaymentTemplate());
    }
    if (!config) {
      message.warning("No hay una plantilla de abono configurada. Ve a Diseñador de plantillas.");
      return;
    }
    const html = resolvePaymentTemplate(config, result);
    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  function buildTemplateMenuItems(): MenuProps["items"] {
    if (!templates.length) {
      return [{ key: "fallback", label: "No hay plantillas guardadas", disabled: true }];
    }
    return [
      {
        key: "default",
        label: "Plantilla por defecto",
        onClick: () => ticketResult && printReceivableTicket(ticketResult),
      },
      { type: "divider" as const },
      ...templates.map((t) => ({
        key: String(t.id),
        label: (
          <span>
            {t.name}
            {t.isDefault && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>Default</Tag>}
          </span>
        ),
        onClick: () => ticketResult && printReceivableTicket(ticketResult, t.id),
      })),
    ];
  }

  // Reimpresión desde la tabla: usa el último pago que ya trae la cuenta
  // (accountReceivable.service.list() incluye payments: take 1, orderBy desc).
  function handleReprintFromRow(record: any, templateId?: number) {
    const lastPayment = record.payments?.[0];
    if (!lastPayment) {
      message.info("Este cliente no tiene abonos registrados aún.");
      return;
    }

    // El saldo antes de ese último pago es matemáticamente exacto:
    // saldo actual + lo que se abonó en ese pago = saldo previo a ese pago.
    const previousBalance = Number(record.balance) + Number(lastPayment.amount);

    const result: PaymentForPrint = {
      payment: lastPayment,
      customer: record.customer,
      previousBalance,
      amountPaid: lastPayment.amount,
      currentBalance: record.balance,
      bankName: lastPayment.bankId
        ? banks.find(b => b.id === lastPayment.bankId)?.name ?? null
        : null,
    };

    printReceivableTicket(result, templateId);
  }

  return (
    <>
      <PageHeader
        title="Cuentas por Cobrar"
        subtitle="Gestión de créditos de clientes"
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
              placeholder="Cliente"
              style={{ width: "100%" }}
              loading={loadingCustomers}
              filterOption={false}
              onSearch={handleSearch}
              onChange={(value) =>
                handleFilterChange({ ...filters, customerId: value })
              }
              options={customers.map((c) => ({
                label: c.name,
                value: c.id,
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
          type="receivable"
          onPay={(record) => setSelected(record)}
          onPrint={handleReprintFromRow}
          printTemplates={templates}
        />
      </Card>

      <Modal
        open={!!selected}
        title="Registrar Pago"
        onCancel={() => {
          setSelected(null);
          setBankId(undefined);
        }}
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

        <Select
          allowClear
          style={{ width: "100%", marginTop: 12 }}
          placeholder="Cuenta bancaria (opcional)"
          value={bankId}
          onChange={setBankId}
          options={banks
            .filter((b) => b.active)
            .map((b) => ({
              label: `${b.name} (${formatCurrency(b.balance)})`,
              value: b.id,
            }))}
        />
      </Modal>
      <Modal
        open={!!ticketResult}
        title="Vista previa del comprobante"
        onCancel={() => setTicketResult(null)}
        footer={[
          <Button key="close" onClick={() => setTicketResult(null)}>
            Cerrar
          </Button>,
          <Dropdown key="print" menu={{ items: buildTemplateMenuItems() }} trigger={["click"]}>
            <Button type="primary">
              Imprimir <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>,
        ]}
      >
        {ticketResult && paymentTemplateConfig && (
          <iframe
            title="preview-abono"
            style={{ width: "100%", height: 420, border: "none" }}
            srcDoc={resolvePaymentTemplate(paymentTemplateConfig, ticketResult)}
          />
        )}
      </Modal>
    </>
  );
}