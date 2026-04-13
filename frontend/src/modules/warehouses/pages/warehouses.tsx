import { useState } from "react";
import { message, Tag, Dropdown, Typography, Button } from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";

import type { Warehouse } from "../types/warehouse";
import { useWarehouses } from "../hooks/useWarehouse";
import { getAllowedRoles } from "../../../core/utils/permissions";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import FormModal from "../../../core/components/forms/FormModal";
import WarehouseForm from "../components/WarehouseForm";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { usePermissions } from "../../../core/hooks/usePermissions";

const { Text } = Typography;

export default function Warehouses() {
  const { warehouses, loading, create, update, toggleActive } = useWarehouses();
  const { canAccess } = usePermissions();
  const { isMobile } = useDeviceType();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(r: Warehouse) { setEditing(r); setOpen(true); }

  async function handleSubmit(values: any) {
    try {
      if (editing) { await update(editing.id, values); message.success("Almacén actualizado"); }
      else { await create(values); message.success("Almacén creado"); }
      setOpen(false);
    } catch { message.error("Error guardando almacén"); }
  }

  function confirmToggle(r: Warehouse) {
    ConfirmModal({
      title: r.active ? "Desactivar almacén" : "Activar almacén",
      content: `¿Seguro que deseas ${r.active ? "desactivar" : "activar"} ${r.name}?`,
      danger: r.active,
      onConfirm: async () => { await toggleActive(r.id, !r.active); message.success("Estado actualizado"); },
    });
  }

  function getRowMenu(r: Warehouse): MenuProps {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("warehouse", "edit"))) {
      items.push({ key: "edit", label: "Editar", icon: <EditOutlined />, onClick: () => openEdit(r)})
    }

    if (canAccess(...getAllowedRoles("warehouse", "delete"))) {
      items.push({
        key: "toggle", danger: r.active,
        label: r.active ? "Desactivar" : "Activar",
        icon: r.active ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => confirmToggle(r),
      });
    }

    return { items };
  }

  const desktopColumns: ColumnsType<Warehouse> = [
    { title: "Nombre", dataIndex: "name" },
    { title: "Activo", dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    {
      title: "Acciones",
      render: (_, r) => (
        <>
          <ProtectedButton roles={getAllowedRoles("warehouse", "edit")} onClick={() => openEdit(r)}>Editar</ProtectedButton>
          <ProtectedButton roles={getAllowedRoles("warehouse", "delete")} danger onClick={() => confirmToggle(r)}>
            {r.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
    },
  ];

  const mobileColumns: ColumnsType<Warehouse> = [
    {
      title: "Almacén",
      render: (_, r) => (
        <div>
          <Text strong>{r.name}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color={r.active ? "green" : "default"}>
              {r.active ? "Activo" : "Inactivo"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "",
      align: "right",
      width: 48,
      render: (_, r) => {
        const menu = getRowMenu(r);
        return (
          <div style={{ textAlign: "right" }}>
            {menu.items && menu.items.length > 0 && (
            <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" style={{ border: "none", boxShadow: "none" }} />
            </Dropdown>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Almacenes"
        subtitle="Gestión de almacenes"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("warehouse", "create")}
            type="primary"
            icon={isMobile ? <PlusOutlined /> : undefined}
            size={isMobile ? "small" : "middle"}
            onClick={openCreate}
          >
            {isMobile ? "Nuevo" : "Nuevo almacén"}
          </ProtectedButton>
        }
      />

      <SimpleTable<Warehouse>
        data={warehouses}
        columns={desktopColumns}
        mobileColumns={mobileColumns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar almacén" : "Nuevo almacén"}
        onClose={() => setOpen(false)}
        mobileHeight="auto"
      >
        <WarehouseForm
          isEdit={!!editing}
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}