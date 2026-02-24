import { useState } from "react";
import { message, Row, Col, Button } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Supplier } from "../../types/supplier";
import { useSuppliers } from "../../hooks/useSuppliers";

import PageHeader from "../../components/common/PageHeader";
import ProtectedButton from "../../components/common/ProtectedButton";
import SimpleTable from "../../components/tables/SimpleTable";
import SupplierForm from "../../components/forms/SupplierForm";
import FormModal from "../../components/forms/FormModal";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

import { getAllowedRoles } from "../../utils/permissions";

export default function Suppliers() {
  const { suppliers, loading, create, update } = useSuppliers();
  const sizes = useResponsiveSizes();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  function buildExportRows(data: Supplier[]) {
    return data
      .filter(s => s.active)
      .map((s) => ({
        Nombre: s.name,
        Email: s.email ?? "-",
        Telefono: s.phone ?? "-",
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

  const columns: ColumnsType<Supplier> = [
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
        <ProtectedButton
          roles={getAllowedRoles("suppliers", "edit")}
          onClick={() => openEdit(r)}
        >
          Editar
        </ProtectedButton>
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
      >
        <Col>
          <Row gutter={12}>
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