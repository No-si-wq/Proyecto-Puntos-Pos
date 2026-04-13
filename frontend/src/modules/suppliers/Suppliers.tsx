import { useState, useEffect } from "react";
import { message, Tag, Dropdown, Typography, Space, Button, Input, type MenuProps } from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
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
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { usePermissions } from "../../core/hooks/usePermissions";

import { getAllowedRoles } from "../../core/utils/permissions";

const { Text } = Typography;

export default function Suppliers() {
  const { suppliers, loading, setFilters, create, update, toggleActive } = useSuppliers();
  const { canAccess } = usePermissions();
  const sizes = useResponsiveSizes();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const { isMobile } = useDeviceType();

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
      const payload = {
        ...values,
        email: values.email?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      }

      if (editing) {
        await update(editing.id, payload);
        message.success("Proveedor actualizado");
      } else {
        await create(payload);
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

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  function getRowMenu(r: Supplier): MenuProps {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("suppliers", "edit"))) {
      items.push({ key: "edit", label: "Editar", icon: <EditOutlined />, onClick: () => openEdit(r) })
    }

    if (canAccess(...getAllowedRoles("suppliers", "delete"))) {
      items.push({
        key: "toggle", danger: r.active,
        label: r.active ? "Desactivar" : "Activar",
        icon: r.active ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => confirmToggle(r),
      });
    }

    return { items };
  }

  const desktopColumns: ColumnsType<Supplier> = [
    { title: "RTN", dataIndex: "rtn" },
    { title: "Nombre",   dataIndex: "name"  },
    { title: "Email",    dataIndex: "email", render: (v) => v ?? "—" },
    { title: "Teléfono", dataIndex: "phone", render: (v) => v ?? "—" },
    { title: "Activo",   dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    {
      title: "Acciones",
      render: (_, r) => (
        <>
          <ProtectedButton roles={getAllowedRoles("suppliers", "edit")} onClick={() => openEdit(r)}>Editar</ProtectedButton>
          <ProtectedButton roles={getAllowedRoles("suppliers", "delete")} danger onClick={() => confirmToggle(r)}>
            {r.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
    },
  ];

  const mobileColumns: ColumnsType<Supplier> = [
    {
      title: "Proveedor",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          {(r.email || r.phone) && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {[r.email, r.phone].filter(Boolean).join(" · ")}
            </Text>
          )}
          <div style={{ marginTop: 4 }}>
            <Tag color={r.active ? "green" : "default"}>{r.active ? "Activo" : "Inactivo"}</Tag>
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
        title="Proveedores"
        subtitle="Gestión de proveedores"
        extra={
          isMobile ? (
            <Space size={6}>
              <ProtectedButton roles={getAllowedRoles("suppliers", "create")} type="primary"
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
              <Text strong>Activos: {suppliers.filter(s => s.active).length}</Text>
              <ProtectedButton roles={getAllowedRoles("suppliers", "create")} type="primary" onClick={openCreate}>
                Nuevo proveedor
              </ProtectedButton>
            </Space>
          )
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder="Buscar por nombre"
          allowClear
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <SimpleTable<Supplier>
        data={suppliers}
        columns={desktopColumns}
        mobileColumns={mobileColumns}
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