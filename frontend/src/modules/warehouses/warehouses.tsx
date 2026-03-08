import { useState } from "react";
import { message } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Warehouse } from "./warehouse";
import { useWarehouses } from "./useWarehouse";
import { getAllowedRoles } from "../../core/utils/permissions";
import PageHeader from "../../core/components/common/PageHeader";
import SimpleTable from "../../core/components/table/SimpleTable";
import FormModal from "../../core/components/forms/FormModal";
import WarehouseForm from "./components/WarehouseForm";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";

export default function Warehouses() {
  const { warehouses, loading, create, update, toggleActive } =
    useWarehouses();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(record: Warehouse) {
    setEditing(record);
    setOpen(true);
  }

  async function handleSubmit(values: any) {
    try {
      if (editing) {
        await update(editing.id, values);
        message.success("Almacén actualizado");
      } else {
        await create(values);
        message.success("Almacén creado");
      }
      setOpen(false);
    } catch {
      message.error("Error guardando almacén");
    }
  }

  function confirmToggle(wareHouse: Warehouse) {
    ConfirmModal({
      title: wareHouse.active
        ? "Desactivar proveedor"
        : "Activar Proveedor",
      content: `¿Seguro que deseas ${
        wareHouse.active ? "desactivar" : "activar"
      } a ${wareHouse.name}?`,
      danger: wareHouse.active,
      onConfirm: async () => {
        await toggleActive(wareHouse.id, !wareHouse.active);
        message.success("Estado actualizado");
      },
    });
  }

  const columns: ColumnsType<Warehouse> = [
    { title: "Nombre", dataIndex: "name" },
    {
      title: "Activo",
      dataIndex: "active",
      render: (v) => (v ? "Sí" : "No"),
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <>
          <ProtectedButton 
            roles={getAllowedRoles("warehouse", "edit")}
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            roles={getAllowedRoles("warehouse", "delete")}
            danger
            onClick={() => confirmToggle(record)}
          >
            {record.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
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
            onClick={openCreate}
          >
            Nuevo almacén
          </ProtectedButton>
        }
      />

      <SimpleTable<Warehouse>
        data={warehouses}
        columns={columns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar almacén" : "Nuevo almacén"}
        onClose={() => setOpen(false)}
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