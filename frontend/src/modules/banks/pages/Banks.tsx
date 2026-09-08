import { useState } from "react";
import { Card, Table, Button, Space, Switch, message } from "antd";
import { PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../core/components/common/PageHeader";
import FormModal from "../../../core/components/forms/FormModal";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { Role } from "../../../core/auth/roles";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { formatCurrency } from "../../../core/utils/formatters";
import { useBanks } from "../hooks/useBanks";
import BankForm from "../components/BankForm";
import BankTransferModal from "../components/BankTransferModal";
import type { Bank, CreateBankInput, UpdateBankInput } from "../types/bank";

export default function Banks() {
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();
  const { data, loading, create, update, toggleActive, transfer } =
    useBanks();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(bank: Bank) {
    setEditing(bank);
    setFormOpen(true);
  }

  async function handleSubmit(values: CreateBankInput | UpdateBankInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await update(editing.id, values);
        message.success("Cuenta actualizada");
      } else {
        await create(values as CreateBankInput);
        message.success("Cuenta creada");
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(bank: Bank, active: boolean) {
    await toggleActive(bank.id, active);
    message.success(active ? "Cuenta activada" : "Cuenta desactivada");
  }

  const columns = [
    { title: "Nombre", dataIndex: "name" },
    {
      title: "Banco",
      dataIndex: "bankName",
      render: (v?: string) => v || "-",
    },
    {
      title: "N.º Cuenta",
      dataIndex: "accountNumber",
      render: (v?: string) => v || "-",
    },
    { title: "Moneda", dataIndex: "currency" },
    {
      title: "Saldo",
      align: "right" as const,
      render: (_: any, r: Bank) => formatCurrency(r.balance),
    },
    {
      title: "Estado",
      align: "center" as const,
      render: (_: any, r: Bank) => (
        <Switch
          checked={r.active}
          onChange={(checked) => handleToggle(r, checked)}
          checkedChildren="Activa"
          unCheckedChildren="Inactiva"
        />
      ),
    },
    {
      title: "",
      align: "center" as const,
      render: (_: any, r: Bank) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/banks/${r.id}`)}>
            Ver movimientos
          </Button>
          <Button size="small" onClick={() => openEdit(r)}>
            Editar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bancos"
        subtitle="Cuentas bancarias, movimientos y transferencias"
        extra={
          <Space>
            <ProtectedButton
              roles={[Role.ADMIN]}
              icon={<SwapOutlined />}
              onClick={() => setTransferOpen(true)}
              disabled={data.length < 2}
            >
              Transferir
            </ProtectedButton>
            <ProtectedButton
              roles={[Role.ADMIN]}
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              Nueva cuenta
            </ProtectedButton>
          </Space>
        }
      />

      <Card style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={isMobile ? { x: true } : undefined}
        />
      </Card>

      <FormModal
        open={formOpen}
        title={editing ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
        onClose={() => setFormOpen(false)}
      >
        <BankForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          loading={submitting}
        />
      </FormModal>

      <BankTransferModal
        open={transferOpen}
        banks={data}
        onClose={() => setTransferOpen(false)}
        onSubmit={transfer}
      />
    </>
  );
}