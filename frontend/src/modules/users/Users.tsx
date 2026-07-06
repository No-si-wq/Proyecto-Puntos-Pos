import { useState, useEffect } from "react";
import { message, Tag, Dropdown, Typography, Space, Button, Input, Switch } from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, LogoutOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import FormModal from "../../core/components/forms/FormModal";

import type { User } from "./user";
import { useUsers } from "./useUsers";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";
import UserForm from "./components/UserForm";
import SimpleTable from "../../core/components/table/SimpleTable";
import { getAllowedRoles } from "../../core/utils/permissions";
import { usePermissions } from "../../core/hooks/usePermissions";

const { Text } = Typography;

export default function Users() {
  const { users, loading, create, update, toggleActive, logoutAll, filters, setFilters } = useUsers();
  const sizes      = useResponsiveSizes();
  const { isMobile } = useDeviceType();
  const { canAccess } = usePermissions();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({ search: searchValue || undefined });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  function buildExportRows(data: User[]) {
    return data.filter(u => u.active).map((u) => ({
      Nombre: u.name, Usuario: u.username, Rol: u.role, Almacen: u.warehouse.name,
    }));
  }

  function handleExportExcel() { exportToExcel(buildExportRows(users), "Usuarios"); }
  function handleExportPdf() {
    exportToPdf("Usuarios", [
      { header: "Nombre", dataKey: "Nombre" }, { header: "Usuario", dataKey: "Usuario" },
      { header: "Rol", dataKey: "Rol" }, { header: "Almacen", dataKey: "Almacen" }
    ], buildExportRows(users), "Usuarios");
  }

  function openCreate() { setEditing(null); setOpen(true); }
  function openEdit(u: User) { setEditing(u); setOpen(true); }

  async function submit(values: any) {
    try {
      const payload = {
        ...values,
        warehouseId: values.warehouseId ?? undefined,  // convierte null/0/"" → undefined
      };
      if (editing) { await update(editing.id, payload); message.success("Usuario actualizado"); }
      else { await create(payload); message.success("Usuario creado"); }
      setOpen(false);
    } catch { message.error("Error guardando usuario"); }
  }

  function confirmToggle(u: User) {
    ConfirmModal({
      title: u.active ? "Desactivar usuario" : "Activar usuario",
      content: `¿Seguro que deseas ${u.active ? "desactivar" : "activar"} a ${u.name}?`,
      danger: u.active,
      onConfirm: async () => { await toggleActive(u.id, !u.active); message.success("Estado actualizado"); },
    });
  }

  function confirmLogoutAll(u: User) {
    ConfirmModal({
      title: "Cerrar todas las sesiones",
      content: `¿Cerrar todas las sesiones de ${u.name}?`,
      danger: true,
      onConfirm: async () => { await logoutAll(u.id); message.success("Sesiones cerradas"); },
    });
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  function getRowMenu(r: User): MenuProps {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("users", "edit"))) {
      items.push({ key: "edit", label: "Editar", icon: <EditOutlined />, onClick: () => openEdit(r) })
    }

    if (canAccess(...getAllowedRoles("users", "delete"))) {
      items.push({
        key: "toggle", danger: r.active,
        label: r.active ? "Desactivar" : "Activar",
        icon: r.active ? <StopOutlined /> : <CheckCircleOutlined />,
        onClick: () => confirmToggle(r),
      });
    }

    if (canAccess(...getAllowedRoles("users", "manage"))) {
      items.push({
        key: "logout", 
        label: "Logout global", 
        icon: <LogoutOutlined />, 
        danger: true,
        onClick: () => confirmLogoutAll(r),
      });
    }

    return { items };
  }

  const desktopColumns: ColumnsType<User> = [
    { title: "Nombre",  dataIndex: "name"     },
    { title: "Usuario", dataIndex: "username" },
    { title: "Rol",     dataIndex: "role"     },
    { title: "Almacen", dataIndex: ["warehouse", "name"], render: (v) => (v ?? "-") },
    { title: "Activo",  dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    {
      title: "Acciones",
      render: (_, r) => (
        <>
          <ProtectedButton roles={getAllowedRoles("users", "edit")} onClick={() => openEdit(r)}>Editar</ProtectedButton>
          <ProtectedButton roles={getAllowedRoles("users", "delete")} danger onClick={() => confirmToggle(r)}>
            {r.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
          <ProtectedButton roles={getAllowedRoles("users", "manage")} danger onClick={() => confirmLogoutAll(r)}>
            Logout global
          </ProtectedButton>
        </>
      ),
    },
  ];

  const mobileColumns: ColumnsType<User> = [
    {
      title: "Usuario",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.username}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.warehouse?.name ?? "-"}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color={r.active ? "green" : "default"} style={{ marginRight: 4 }}>
              {r.active ? "Activo" : "Inactivo"}
            </Tag>
            <Tag>{r.role}</Tag>
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
        title="Usuarios"
        subtitle="Gestión de usuarios del sistema"
        extra={
          isMobile ? (
            <Space size={6}>
              <ProtectedButton roles={getAllowedRoles("users", "create")} type="primary"
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
              <Text strong>Activos: {users.filter(u => u.active).length}</Text>
              <ProtectedButton roles={getAllowedRoles("users", "create")} type="primary" onClick={openCreate}>
                Nuevo usuario
              </ProtectedButton>
            </Space>
          )
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder="Buscar por nombre"
          allowClear
          size={sizes.input}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: "100%" }}
        />

        <Space style={{ marginTop: 12 }}> 
          <Switch
            checked={filters.onlyInactive}
            onChange={(val) => { setFilters((prev) => ({...prev, onlyInactive: val})) }}
          />
          <Text>Mostrar inactivos</Text>
        </Space>
      </div>

      <SimpleTable<User> data={users} columns={desktopColumns} mobileColumns={mobileColumns} loading={loading} />

      <FormModal open={open} title={editing ? "Editar usuario" : "Nuevo usuario"} onClose={() => setOpen(false)}>
        <UserForm isEdit={!!editing} initialValues={editing ?? undefined} onSubmit={submit} onCancel={() => setOpen(false)} />
      </FormModal>
    </>
  );
}