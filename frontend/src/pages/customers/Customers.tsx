import { useState } from "react";
import { message, Button, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Customer } from "../../types/customer";
import FormModal from "../../components/forms/FormModal";

import { useCustomers } from "../../hooks/useCustomers";

import PageHeader from "../../components/common/PageHeader";
import ProtectedButton from "../../components/common/ProtectedButton";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import CustomerForm, { type CustomerFormValues } from "../../components/forms/CustomerForm";
import SimpleTable from "../../components/tables/SimpleTable";

import { getAllowedRoles } from "../../utils/permissions";

export default function Customers() {
  const {
    customers,
    loading,
    create,
    update,
    toggleActive,
  } = useCustomers();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const sizes = useResponsiveSizes();

  function buildExportRows(data: Customer[]) {
    return data
      .filter(c => c.active)
      .map((c) => ({
        Nombre: c.name,
        Email: c.email ?? "-",
        Telefono: c.phone ?? "-",
        Puntos: c.points?.balance ?? 0,
      }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(customers),
      "Clientes"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Clientes",
      [
        { header: "Nombre", dataKey: "Nombre" },
        { header: "Email", dataKey: "Email" },
        { header: "Telefono", dataKey: "Telefono" },
        { header: "Puntos", dataKey: "Puntos" },
      ],
      buildExportRows(customers),
      "Clientes"
    );
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setOpen(true);
  }

  async function submit(values: CustomerFormValues) {
    try {
      const payload = {
        ...values,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      }

      if (editing) {
        await update(editing.id, payload);
        message.success("Cliente actualizado");
      } else {
        await create(payload);
        message.success("Cliente creado");
      }
      setOpen(false);
    } catch {
      message.error("Error guardando cliente");
    }
  }

  function confirmToggle(customer: Customer) {
    ConfirmModal({
      title: customer.active
        ? "Desactivar cliente"
        : "Activar cliente",
      content: `¿Seguro que deseas ${
        customer.active ? "desactivar" : "activar"
      } a ${customer.name}?`,
      danger: customer.active,
      onConfirm: async () => {
        await toggleActive(customer.id, !customer.active);
        message.success("Estado actualizado");
      },
    });
  }

  const columns: ColumnsType<Customer> = [
    { title: "Nombre", dataIndex: "name" },
    {
      title: "Email",
      dataIndex: "email",
      render: (v) => v ?? "-",
    },
    {
      title: "Teléfono",
      dataIndex: "phone",
      render: (v) => v ?? "-",
    },
    {
      title: "Activo",
      dataIndex: "active",
      render: (v) => (v ? "Sí" : "No"),
    },
    {
      title: "Puntos",
      dataIndex: "points",
      align: "right",
      render: (_, r) =>
        new Intl.NumberFormat("es-HN").format(
          r.points?.balance ?? 0
        ),
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <>
          <ProtectedButton
            roles={getAllowedRoles("customers", "edit")}
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            roles={getAllowedRoles("customers", "delete")}
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
        title="Clientes"
        subtitle="Gestión de clientes"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("customers", "create")}
            type="primary"
            onClick={openCreate}
          >
            Nuevo cliente
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
            Activos: {customers.filter(c => c.active).length}
          </strong>
        </Col>
      </Row>

      <SimpleTable<Customer>
        data={customers}
        columns={columns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
        onClose={() => setOpen(false)}
      >
        <CustomerForm 
          isEdit={!!editing}
          initialValues={editing ?? undefined}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}