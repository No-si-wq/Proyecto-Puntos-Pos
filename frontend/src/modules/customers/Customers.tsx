import { useState } from "react";
import { message, Tag, Dropdown, Typography, Space, Button } from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";

import type { Customer } from "./customer";
import FormModal from "../../core/components/forms/FormModal";
import { useCustomers } from "./useCustomers";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import CustomerForm from "./components/CustomerForm";
import SimpleTable from "../../core/components/table/SimpleTable";
import { getAllowedRoles } from "../../core/utils/permissions";
import { usePermissions } from "../../core/hooks/usePermissions";

const { Text } = Typography;

export default function Customers() {
  const { customers, loading, create, update, toggleActive } = useCustomers();
  const sizes      = useResponsiveSizes();
  const { isMobile } = useDeviceType();
  const { canAccess } = usePermissions();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  function buildExportRows(data: Customer[]) {
    return data.filter(c => c.active).map((c) => ({
      DNI: c.dni, Nombre: c.name, Email: c.email ?? "-",
      Telefono: c.phone ?? "-", Direccion: c.direction ?? "-", 
      Puntos: c.points?.balance ?? 0,
    }));
  }

  function handleExportExcel() { exportToExcel(buildExportRows(customers), "Clientes"); }
  function handleExportPdf() {
    exportToPdf("Clientes", [
      { header: "DNI", dataKey: "DNI" }, { header: "Nombre", dataKey: "Nombre" },
      { header: "Email", dataKey: "Email" }, { header: "Telefono", dataKey: "Telefono" },
      { header: "Direccion", dataKey: "Direccion" }, { header: "Puntos", dataKey: "Puntos" },
    ], buildExportRows(customers), "Clientes");
  }

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(c: Customer) { setEditing(c); setOpen(true); }

  async function submit(values: any) {
    try {
      const payload = { 
        ...values, 
        email: values.email?.trim() || undefined, 
        phone: values.phone?.trim() || undefined,
        direction: values.direction?.trim() || undefined,
      };
      if (editing) { await update(editing.id, payload); message.success("Cliente actualizado"); }
      else { await create(payload); message.success("Cliente creado"); }
      setOpen(false);
    } catch { message.error("Error guardando cliente"); }
  }

  function confirmToggle(c: Customer) {
    ConfirmModal({
      title: c.active ? "Desactivar cliente" : "Activar cliente",
      content: `¿Seguro que deseas ${c.active ? "desactivar" : "activar"} a ${c.name}?`,
      danger: c.active,
      onConfirm: async () => { await toggleActive(c.id, !c.active); message.success("Estado actualizado"); },
    });
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  function getRowMenu(r: Customer): MenuProps {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("customers", "edit"))) {
      items.push({ key: "edit", label: "Editar", icon: <EditOutlined />, onClick: () => openEdit(r) });
    }

    if (canAccess(...getAllowedRoles("customers", "delete"))) {
      items.push({
        key: "toggle", danger: r.active,
        label: r.active ? "Desactivar" : "Activar",
        icon: r.active ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => confirmToggle(r),
      });
    }

    return { items };
  }

  const desktopColumns: ColumnsType<Customer> = [
    { title: "DNI",      dataIndex: "dni",   render: (v) => v ?? "-" },
    { title: "Nombre",   dataIndex: "name"  },
    { title: "Email",    dataIndex: "email", render: (v) => v ?? "-" },
    { title: "Teléfono", dataIndex: "phone", render: (v) => v ?? "-" },
    { title: "Direccion", dataIndex: "direction", render: (v) => v ?? "-" },
    { title: "Activo",   dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    { title: "Puntos",   dataIndex: "points", align: "right",
      render: (_, r) => new Intl.NumberFormat("es-HN").format(r.points?.balance ?? 0) },
    {
      title: "Acciones",
      render: (_, r) => (
        <>
          <ProtectedButton roles={getAllowedRoles("customers", "edit")} onClick={() => openEdit(r)}>Editar</ProtectedButton>
          <ProtectedButton roles={getAllowedRoles("customers", "delete")} danger onClick={() => confirmToggle(r)}>
            {r.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
    },
  ];

  const mobileColumns: ColumnsType<Customer> = [
    {
      title: "Cliente",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.dni ?? "Sin DNI"}</Text>
          {(r.email || r.phone || r.direction) && (
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              {[r.email, r.phone, r.direction].filter(Boolean).join(" · ")}
            </Text>
          )}
          <div style={{ marginTop: 4 }}>
            <Tag color={r.active ? "green" : "default"}>{r.active ? "Activo" : "Inactivo"}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Puntos",
      align: "right",
      render: (_, r) => {
        const menu = getRowMenu(r);
        return (
          <div style={{ textAlign: "right" }}>
            <Text strong style={{ display: "block" }}>
              {new Intl.NumberFormat("es-HN").format(r.points?.balance ?? 0)}
            </Text>
            <Text type="secondary" style={{ fontSize: 10 }}>pts</Text>
            {menu.items && menu.items.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
                  <Button icon={<MoreOutlined />} size="small" style={{ border: "none", boxShadow: "none" }} />
                </Dropdown>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Gestión de clientes"
        extra={
          isMobile ? (
            <Space size={6}>
              <ProtectedButton roles={getAllowedRoles("customers", "create")} type="primary"
                icon={<PlusOutlined />} size="small" onClick={openCreate}>
                Nuevo
              </ProtectedButton>
              <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          ) : (
            <Space wrap>
              <Button onClick={handleExportExcel} size={sizes.button}>Exportar Excel</Button>
              <Button onClick={handleExportPdf}   size={sizes.button}>Exportar PDF</Button>
              <Text strong>Activos: {customers.filter(c => c.active).length}</Text>
              <ProtectedButton roles={getAllowedRoles("customers", "create")} type="primary" onClick={openCreate}>
                Nuevo cliente
              </ProtectedButton>
            </Space>
          )
        }
      />

      <SimpleTable<Customer> data={customers} columns={desktopColumns} mobileColumns={mobileColumns} loading={loading} />

      <FormModal open={open} title={editing ? "Editar cliente" : "Nuevo cliente"} onClose={() => setOpen(false)}>
        <CustomerForm isEdit={!!editing} initialValues={editing ?? undefined} onSubmit={submit} onCancel={() => setOpen(false)} />
      </FormModal>
    </>
  );
}