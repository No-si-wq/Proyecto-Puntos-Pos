import { useState } from "react";
import { message } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Warehouse } from "../../types/warehouse";
import { useWarehouses } from "../../hooks/useWarehouse";
import { getAllowedRoles } from "../../utils/permissions";
import PageHeader from "../../components/common/PageHeader";
import SimpleTable from "../../components/tables/SimpleTable";
import FormModal from "../../components/forms/FormModal";
import WarehouseForm from "../../components/forms/WarehouseForm";
import ProtectedButton from "../../components/common/ProtectedButton";

export default function Warehouses() {
  const { warehouses, loading, create, update, remove } =
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
            onClick={() => remove(record.id)}
          >
            Desactivar
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
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}