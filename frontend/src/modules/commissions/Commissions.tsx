import { useState } from "react";
import { Tabs, Table, Tag, Space, Typography, Dropdown } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import FormModal from "../../core/components/forms/FormModal";
import { CommissionLevelForm } from "./components/CommissionLevelForm";
import { AssignCommissionForm } from "./components/AssignCommissionForm";
import { useCommissionLevels, useCommissions } from "./useCommissions";
import { getAllowedRoles } from "../../core/utils/permissions";
import type { CommissionLevel, SalesCommission } from "./commission";
import { useUsers } from "../users/useUsers";
import { useDeviceType } from "../../core/hooks/useDeviceType";

const { Text } = Typography;

export default function Commissions() {
  const {
    levels,
    loading: levelsLoading,
    create: createLevel,
    update: updateLevel,
    remove: removeLevel,
  } = useCommissionLevels();

  const {
    commissions,
    loading: commissionsLoading,
    assign,
    update: updateCommission,
    remove: removeCommission,
  } = useCommissions();

  const { users } = useUsers();
  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  const [levelFormOpen, setLevelFormOpen]     = useState(false);
  const [editLevel, setEditLevel]             = useState<CommissionLevel | null>(null);
  const [assignFormOpen, setAssignFormOpen]   = useState(false);
  const [editCommission, setEditCommission]   = useState<SalesCommission | null>(null);

  const handleLevelSubmit = async (values: any) => {
    if (editLevel) await updateLevel(editLevel.id, values);
    else await createLevel(values);
    setLevelFormOpen(false);
  };

  const handleAssignSubmit = async (values: any) => {
    if (editCommission) await updateCommission(editCommission.id, values);
    else await assign(values);
    setAssignFormOpen(false);
  };

  const getLevelMenu = (record: CommissionLevel): MenuProps => ({
    items: [
      {
        key: "edit",
        label: "Editar",
        icon: <EditOutlined />,
        onClick: () => { setEditLevel(record); setLevelFormOpen(true); },
      },
      {
        key: "delete",
        label: "Eliminar",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => removeLevel(record.id),
      },
    ],
  });

  const getCommissionMenu = (record: SalesCommission): MenuProps => ({
    items: [
      {
        key: "edit",
        label: "Editar",
        icon: <EditOutlined />,
        onClick: () => { setEditCommission(record); setAssignFormOpen(true); },
      },
      {
        key: "delete",
        label: "Eliminar",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => removeCommission(record.id, record.level.active),
      },
    ],
  });

  const levelColumnsDesktop = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Lista de precios",
      key: "priceList",
      render: (_: any, r: CommissionLevel) =>
        r.priceList
          ? <Tag color="blue">{r.priceList.name}</Tag>
          : <Text type="secondary">Precio base</Text>,
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

  const levelColumnsMobile = [
    {
      title: "Nivel",
      key: "info",
      render: (_: any, r: CommissionLevel) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
            {r.priceList
              ? <Tag color="blue">{r.priceList.name}</Tag>
              : <Tag>Precio base</Tag>
            }
            <Tag>{r._count?.commissions ?? 0} vendedores</Tag>
          </div>
          {r.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: CommissionLevel) => (
        <Dropdown menu={getLevelMenu(record)} trigger={["click"]} placement="bottomRight">
          <MoreOutlined style={{ fontSize: 20, padding: 8 }} />
        </Dropdown>
      ),
    },
  ];

  const commissionColumnsDesktop = [
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

  const commissionColumnsMobile = [
    {
      title: "Vendedor",
      key: "info",
      render: (_: any, r: SalesCommission) => (
        <div>
          <Text strong style={{ display: "block" }}>
            {r.user?.name ?? r.user?.username ?? `Usuario #${r.userId}`}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="blue" style={{ marginRight: 4 }}>
              {r.level?.name ?? `Nivel #${r.levelId}`}
            </Tag>
            <Text strong style={{ color: "#52c41a", fontSize: 13 }}>
              {Number(r.percent).toFixed(2)}%
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: SalesCommission) => (
        <Dropdown menu={getCommissionMenu(record)} trigger={["click"]} placement="bottomRight">
          <MoreOutlined style={{ fontSize: 20, padding: 8 }} />
        </Dropdown>
      ),
    },
  ];

  const addLevelBtn = (
    <ProtectedButton
      roles={getAllowedRoles("commission", "create")}
      type="primary"
      icon={<PlusOutlined />}
      size={isMobile ? "small" : "middle"}
      onClick={() => { setEditLevel(null); setLevelFormOpen(true); }}
    >
      {isMobile ? "Nuevo" : "Nuevo nivel"}
    </ProtectedButton>
  );

  const assignBtn = (
    <ProtectedButton
      roles={getAllowedRoles("commission", "create")}
      type="primary"
      icon={<PlusOutlined />}
      size={isMobile ? "small" : "middle"}
      onClick={() => { setEditCommission(null); setAssignFormOpen(true); }}
    >
      {isMobile ? "Asignar" : "Asignar comisión"}
    </ProtectedButton>
  );

  return (
    <>
      <PageHeader title="Comisiones de venta" />

      <Tabs
        defaultActiveKey="assignments"
        size={isCompact ? "small" : "middle"}
        items={[
          {
            key: "assignments",
            label: "Asignaciones",
            children: (
              <>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
                  {assignBtn}
                </div>
                <Table
                  rowKey="id"
                  columns={isCompact ? commissionColumnsMobile : commissionColumnsDesktop}
                  dataSource={commissions}
                  loading={commissionsLoading}
                  pagination={{ pageSize: 15, simple: isCompact }}
                  size={isCompact ? "small" : "middle"}
                />
              </>
            ),
          },
          {
            key: "levels",
            label: "Niveles",
            children: (
              <>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
                  {addLevelBtn}
                </div>
                <Table
                  rowKey="id"
                  columns={isCompact ? levelColumnsMobile : levelColumnsDesktop}
                  dataSource={levels}
                  loading={levelsLoading}
                  pagination={{ pageSize: 15, simple: isCompact }}
                  size={isCompact ? "small" : "middle"}
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