import { useState, useEffect } from "react";
import { message, Row, Col, Button, Input } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Supplier } from "./supplier";
import { useSuppliers } from "./useSuppliers";

import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import SimpleTable from "../../core/components/table/SimpleTable";
import SupplierForm from "./components/SupplierForm";
import FormModal from "../../core/components/forms/FormModal";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";

import { getAllowedRoles } from "../../core/utils/permissions";

export default function Suppliers() {
  const { suppliers, loading, setFilters, create, update, toggleActive } = useSuppliers();
  const sizes = useResponsiveSizes();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({
        search: searchValue || undefined,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  function buildExportRows(data: Supplier[]) {
    return data
      .filter(s => s.active)
      .map((s) => ({
        Nombre: s.name,
        Email: s.email ?? "-",
        Telefono: s.phone ?? "-",
        RTN: s.rtn ?? "-",
      }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(suppliers),
      "Proveedores"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Proveedores",
      [
        { header: "RTN", dataKey: "RTN" },
        { header: "Nombre", dataKey: "Nombre" },
        { header: "Email", dataKey: "Email" },
        { header: "Telefono", dataKey: "Telefono" },
      ],
      buildExportRows(suppliers),
      "Proveedores"
    );
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setOpen(true);
  }

  async function submit(values: any) {
    try {
      if (editing) {
        await update(editing.id, values);
        message.success("Proveedor actualizado");
      } else {
        await create(values);
        message.success("Proveedor creado");
      }
      setOpen(false);
    } catch {
      message.error("Error guardando proveedor");
    }
  }

  function confirmToggle(supplier: Supplier) {
    ConfirmModal({
      title: supplier.active
        ? "Desactivar proveedor"
        : "Activar Proveedor",
      content: `¿Seguro que deseas ${
        supplier.active ? "desactivar" : "activar"
      } a ${supplier.name}?`,
      danger: supplier.active,
      onConfirm: async () => {
        await toggleActive(supplier.id, !supplier.active);
        message.success("Estado actualizado");
      },
    });
  }

  const columns: ColumnsType<Supplier> = [
    { title: "RTN", dataIndex: "rtn", render: (v) => v ?? "—" },
    { title: "Nombre", dataIndex: "name" },
    { title: "Email", dataIndex: "email", render: (v) => v ?? "—" },
    { title: "Teléfono", dataIndex: "phone", render: (v) => v ?? "—" },
    {
      title: "Activo",
      dataIndex: "active",
      render: (v) => (v ? "Sí" : "No"),
    },
    {
      title: "Acciones",
      render: (_, r) => (
        <>
          <ProtectedButton
            roles={getAllowedRoles("suppliers", "edit")}
            onClick={() => openEdit(r)}
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            roles={getAllowedRoles("suppliers", "delete")}
            danger
            onClick={() => confirmToggle(r)}
          >
            {r.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle="Gestión de proveedores"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("suppliers", "create")}
            type="primary"
            onClick={openCreate}
          >
            Nuevo proveedor
          </ProtectedButton>
        }
      />

      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
        gutter={[16, 16]}
      >
        <Input
          placeholder="Buscar por nombre"
          allowClear
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Col>
          <Row gutter={[16, sizes.gutter]}>
            <Col>
              <Button
                type="default"
                onClick={handleExportExcel}
                size={sizes.button}
              >
                Exportar Excel
              </Button>
            </Col>

            <Col>
              <Button
                type="default"
                onClick={handleExportPdf}
                size={sizes.button}
              >
                Exportar PDF
              </Button>
            </Col>
          </Row>
        </Col>

        <Col>
          <strong>
            Activos: {suppliers.filter(s => s.active).length}
          </strong>
        </Col>
      </Row>

      <SimpleTable<Supplier>
        data={suppliers}
        columns={columns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar proveedor" : "Nuevo proveedor"}
        onClose={() => setOpen(false)}
      >
        <SupplierForm
          isEdit={!!editing}
          initialValues={editing ?? undefined}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}