import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Space, Tag, message } from "antd";
import {
  ArrowLeftOutlined,
  SwapOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../core/components/common/PageHeader";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { Role } from "../../../core/auth/roles";
import { formatCurrency } from "../../../core/utils/formatters";
import { useBankDetail } from "../hooks/useBankDetail";
import { useBanks } from "../hooks/useBanks";
import BankTransactionsTable from "../components/BankTransactionsTable";
import BankMovementModal from "../components/BankMovementModal";
import BankTransferModal from "../components/BankTransferModal";
import type { BankMovementInput, BankTransferInput } from "../types/bank";

export default function BankDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bankId = Number(id);

  const { bank, transactions, loading, registerMovement, reconcile } =
    useBankDetail(bankId);
  const { data: allBanks, transfer } = useBanks();

  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

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

      <Card title="Movimientos">
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