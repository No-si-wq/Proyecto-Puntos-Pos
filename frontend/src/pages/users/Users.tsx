import { useState } from "react";
import { message, Button, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import FormModal from "../../components/forms/FormModal"

import type { User } from "../../types/user";

import { useUsers } from "../../hooks/useUsers";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

import PageHeader from "../../components/common/PageHeader";
import ProtectedButton from "../../components/common/ProtectedButton";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import UserForm from "../../components/forms/UserForm";
import SimpleTable from "../../components/tables/SimpleTable";

import { getAllowedRoles } from "../../utils/permissions";

export default function Users() {
  const {
    users,
    loading,
    create,
    update,
    logoutAll,
  } = useUsers();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const sizes = useResponsiveSizes();

  function buildExportRows(data: User[]) {
    return data
      .filter(u => u.active)
      .map((u) => ({
        Nombre: u.name,
        Email: u.email ?? "-",
        Usuario: u.username,
        Rol: u.role,
      }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(users),
      "Usuarios"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Usuarios",
      [
        { header: "Nombre", dataKey: "Nombre" },
        { header: "Email", dataKey: "Email" },
        { header: "Usuario", dataKey: "Usuario" },
        { header: "Rol", dataKey: "Rol" },
      ],
      buildExportRows(users),
      "Usuarios"
    );
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setOpen(true);
  }

  async function submit(values: any) {
    try {
      if (editing) {
        await update(editing.id, values);
        message.success("Usuario actualizado");
      } else {
        await create(values);
        message.success("Usuario creado");
      }
      setOpen(false);
    } catch {
      message.error("Error guardando usuario");
    }
  }

  function confirmLogoutAll(user: User) {
    ConfirmModal({
      title: "Cerrar todas las sesiones",
      content: `¿Cerrar todas las sesiones de ${user.name}?`,
      danger: true,
      onConfirm: async () => {
        await logoutAll(user.id);
        message.success("Sesiones cerradas");
      },
    });
  }

  const columns: ColumnsType<User> = [
    { title: "Email", dataIndex: "email" },
    { title: "Nombre", dataIndex: "name" },
    { title: "Usuario", dataIndex: "username" },
    { title: "Rol", dataIndex: "role" },
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
            roles={getAllowedRoles("users", "edit")}
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            roles={getAllowedRoles("users", "manage")}
            danger
            onClick={() => confirmLogoutAll(record)}
          >
            Logout global
          </ProtectedButton>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de usuarios del sistema"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("users", "create")}
            type="primary"
            onClick={openCreate}
          >
            Nuevo usuario
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
            Activos: {users.filter(u => u.active).length}
          </strong>
        </Col>
      </Row>

      <SimpleTable<User>
        data={users}
        columns={columns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        onClose={() => setOpen(false)}
      >
        <UserForm
          isEdit={!!editing}
          initialValues={editing ?? undefined}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}