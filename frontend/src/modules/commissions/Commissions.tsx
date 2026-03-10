import { useState } from "react";
import { Tabs, Table, Tag, Space, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import FormModal from "../../core/components/forms/FormModal";
import { CommissionLevelForm } from "./components/CommissionLevelForm";
import { AssignCommissionForm } from "./components/AssignCommissionForm";
import { useCommissionLevels, useCommissions } from "./useCommissions";
import { getAllowedRoles } from "../../core/utils/permissions";
import type { CommissionLevel, SalesCommission } from "./commission";
import { useUsers } from "../users/useUsers";

const { Text } = Typography;

export default function Commissions() {
  const { levels, loading: levelsLoading, create: createLevel, update: updateLevel, remove: removeLevel } =
    useCommissionLevels();
  const { commissions, loading: commissionsLoading, assign, update: updateCommission, remove: removeCommission } =
    useCommissions();
  const { users } = useUsers();

  const [levelFormOpen, setLevelFormOpen] = useState(false);
  const [editLevel, setEditLevel] = useState<CommissionLevel | null>(null);

  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [editCommission, setEditCommission] = useState<SalesCommission | null>(null);

  const handleLevelSubmit = async (values: any) => {
    if (editLevel) {
      await updateLevel(editLevel.id, values);
    } else {
      await createLevel(values);
    }
    setLevelFormOpen(false);
  };

  const handleAssignSubmit = async (values: any) => {
    if (editCommission) {
      await updateCommission(editCommission.id, values);
    } else {
      await assign(values);
    }
    setAssignFormOpen(false);
  };

  const levelColumns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      render: (d: string) => d || <Text type="secondary">—</Text>,
    },
    {
      title: "Asignaciones",
      key: "count",
      render: (_: any, r: CommissionLevel) => (
        <Tag>{r._count?.commissions ?? 0} vendedores</Tag>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: CommissionLevel) => (
        <Space>
          <ProtectedButton
            roles={getAllowedRoles("commission", "edit")}
            icon={<EditOutlined />}
            size="small"
            onClick={() => { setEditLevel(record); setLevelFormOpen(true); }}
          > 
            Editar
          </ProtectedButton>
          <ProtectedButton
            roles={getAllowedRoles("commission", "delete")}
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeLevel(record.id)}
          >
            Eliminar
          </ProtectedButton>
        </Space>
      ),
    },
  ];

  const commissionColumns = [
    {
      title: "Vendedor",
      key: "user",
      render: (_: any, r: SalesCommission) =>
        r.user?.name ?? r.user?.username ?? `Usuario #${r.userId}`,
    },
    {
      title: "Nivel",
      key: "level",
      render: (_: any, r: SalesCommission) => (
        <Tag color="blue">{r.level?.name ?? `Nivel #${r.levelId}`}</Tag>
      ),
    },
    {
      title: "Comisión",
      dataIndex: "percent",
      key: "percent",
      render: (p: number) => (
        <Text strong style={{ color: "#52c41a" }}>{Number(p).toFixed(2)}%</Text>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: SalesCommission) => (
        <Space>
          <ProtectedButton
            roles={getAllowedRoles("commission", "edit")}
            icon={<EditOutlined />}
            size="small"
            onClick={() => { setEditCommission(record); setAssignFormOpen(true); }}
          >
            Editar
          </ProtectedButton>
          <ProtectedButton
            roles={getAllowedRoles("commission", "delete")}
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeCommission(record.id, record.level.active)}
          >
            Eliminar
          </ProtectedButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Comisiones de venta" />

      <Tabs
        defaultActiveKey="assignments"
        items={[
          {
            key: "assignments",
            label: "Asignaciones",
            children: (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
                  <ProtectedButton
                    roles={getAllowedRoles("commission", "create")}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditCommission(null); setAssignFormOpen(true); }}
                  >
                    Asignar comisión
                  </ProtectedButton>
                </div>
                <Table
                  rowKey="id"
                  columns={commissionColumns}
                  dataSource={commissions}
                  loading={commissionsLoading}
                  pagination={{ pageSize: 15 }}
                />
              </>
            ),
          },
          {
            key: "levels",
            label: "Niveles",
            children: (
              <>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
                  <ProtectedButton
                    roles={getAllowedRoles("commission", "create")}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setEditLevel(null); setLevelFormOpen(true); }}
                  >
                    Nuevo nivel
                  </ProtectedButton>
                </div>
                <Table
                  rowKey="id"
                  columns={levelColumns}
                  dataSource={levels}
                  loading={levelsLoading}
                  pagination={{ pageSize: 15 }}
                />
              </>
            ),
          },
        ]}
      />

      <FormModal
        open={levelFormOpen}
        title={editLevel ? "Editar nivel de comisión" : "Nuevo nivel de comisión"}
        onClose={() => setLevelFormOpen(false)}
      >
        <CommissionLevelForm
          onSubmit={handleLevelSubmit}
          onCancel={() => setLevelFormOpen(false)}
          initial={editLevel}
        />
      </FormModal>

      <FormModal
        open={assignFormOpen}
        title={editCommission ? "Editar comisión" : "Asignar comisión"}
        onClose={() => setAssignFormOpen(false)}
      >
        <AssignCommissionForm
          onSubmit={handleAssignSubmit}
          onCancel={() => setAssignFormOpen(false)}
          levels={levels}
          users={users}
          initial={editCommission}
        />
      </FormModal>
    </>
  );
}