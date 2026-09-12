import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Space, Tag, message } from "antd";
import {
  ArrowLeftOutlined,
  SwapOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../core/components/common/PageHeader";
import ResponsiveRangePicker from "../../../core/components/common/ResponsiveRangePicker";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { Role } from "../../../core/auth/roles";
import { formatCurrency } from "../../../core/utils/formatters";
import { useBankDetail } from "../hooks/useBankDetail";
import { useBanks } from "../hooks/useBanks";
import BankTransactionsTable from "../components/BankTransactionsTable";
import BankMovementModal from "../components/BankMovementModal";
import BankTransferModal from "../components/BankTransferModal";
import {
  exportBankStatementToExcel,
  exportBankStatementToPdf,
} from "../utils/exportBankStatement";
import type { BankMovementInput, BankTransferInput } from "../types/bank";

export default function BankDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bankId = Number(id);

  const { bank, transactions, loading, registerMovement, reconcile, fetchStatement } =
    useBankDetail(bankId);
  const { data: allBanks, transfer } = useBanks();
  const { isMobile } = useDeviceType();

  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statementRange, setStatementRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("day"),
  ]);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  async function handleMovement(data: BankMovementInput) {
    await registerMovement(data);
    setMovementOpen(false);
  }

  async function handleTransfer(values: BankTransferInput) {
    await transfer(values);
    setTransferOpen(false);
  }

  async function handleReconcile(ids: number[]) {
    await reconcile(ids);
    message.success(
      ids.length > 1 ? "Movimientos conciliados" : "Movimiento conciliado"
    );
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const statement = await fetchStatement({
        from: statementRange[0].toISOString(),
        to: statementRange[1].toISOString(),
      });
      if (!statement) return;
      exportBankStatementToExcel(
        statement,
        statementRange[0].format("DD/MM/YYYY"),
        statementRange[1].format("DD/MM/YYYY")
      );
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      const statement = await fetchStatement({
        from: statementRange[0].toISOString(),
        to: statementRange[1].toISOString(),
      });
      if (!statement) return;
      exportBankStatementToPdf(
        statement,
        statementRange[0].format("DD/MM/YYYY"),
        statementRange[1].format("DD/MM/YYYY")
      );
    } finally {
      setExporting(null);
    }
  }

  if (!bank) return null;

  return (
    <>
      <PageHeader
        title={bank.name}
        subtitle={bank.bankName || undefined}
        breadcrumb={[{ title: "Bancos" }, { title: bank.name }]}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/banks")}
            >
              Volver
            </Button>
            <ProtectedButton
              roles={[Role.ADMIN]}
              icon={<SwapOutlined />}
              onClick={() => setTransferOpen(true)}
            >
              Transferir
            </ProtectedButton>
            <ProtectedButton
              roles={[Role.ADMIN]}
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setMovementOpen(true)}
            >
              Registrar Movimiento
            </ProtectedButton>
          </Space>
        }
      />

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }}>
          <Descriptions.Item label="Banco">
            {bank.bankName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="N.º Cuenta">
            {bank.accountNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Moneda">
            {bank.currency}
          </Descriptions.Item>
          <Descriptions.Item label="Estado">
            {bank.active ? (
              <Tag color="green">Activa</Tag>
            ) : (
              <Tag color="red">Inactiva</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#888" }}>Saldo actual</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {formatCurrency(bank.balance)}
          </div>
        </div>
      </Card>

      <Card
        title="Movimientos"
        extra={
          <Space direction={isMobile ? "vertical" : "horizontal"}>
            <ResponsiveRangePicker
              value={statementRange}
              onChange={(val) => val && setStatementRange(val as [Dayjs, Dayjs])}
            />
            <Button
              icon={<FileExcelOutlined />}
              loading={exporting === "excel"}
              onClick={handleExportExcel}
            >
              {!isMobile && "Excel"}
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              loading={exporting === "pdf"}
              onClick={handleExportPdf}
            >
              {!isMobile && "PDF"}
            </Button>
          </Space>
        }
      >
         <BankTransactionsTable
           data={transactions}
           loading={loading}
           onReconcile={handleReconcile}
         />
       </Card>

      <BankMovementModal
        bank={movementOpen ? bank : null}
        onClose={() => setMovementOpen(false)}
        onSubmit={handleMovement}
      />

      <BankTransferModal
        open={transferOpen}
        banks={allBanks}
        defaultFromBankId={bank.id}
        onClose={() => setTransferOpen(false)}
        onSubmit={handleTransfer}
      />
    </>
  );
}