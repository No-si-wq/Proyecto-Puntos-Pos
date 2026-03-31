import { useState } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Modal,
  message,
  Tag,
  Form,
  Input,
  Dropdown,
} from "antd";
import { useRef } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SubnodeOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { Category } from "./category";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import { getAllowedRoles } from "../../core/utils/permissions";
import FormModal from "../../core/components/forms/FormModal";
import CreateEditCategoryForm from "./Components/CategoryForm";
import CategoryTreeView from "./Components/CategoryTreeView";
import { useCategories } from "./useCategories";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { parseCategoriesExcel } from "../../core/utils/categoryExport";
import http from "../../core/http/http";
import {
  exportCategoriesToExcel,
  exportCategoriesToPDF,
} from "../../core/utils/categoryExport";
import { useDeviceType } from "../../core/hooks/useDeviceType";

export default function Categories() {
  const {
    categoryTree,
    reload,
    create,
    update,
    toggleActive,
    createHierarchy,
  } = useCategories();

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [editing, setEditing]               = useState<Category | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [hierarchyForm]                     = Form.useForm();
  const fileInputRef                        = useRef<HTMLInputElement | null>(null);
  const sizes                               = useResponsiveSizes();
  const { isMobile }                        = useDeviceType();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = () => {
    if (!selectedCategory) return;
    setEditing(selectedCategory);
    setModalOpen(true);
  };
  const openCreateSublevel = () => {
    if (!selectedCategory) return;
    setHierarchyModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, values);
        message.success("Categoría actualizada");
      } else {
        await create(values);
        message.success("Categoría creada");
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const paths = await parseCategoriesExcel(file);
      await http.post("/categories/import", { paths });
      await reload();
      message.success("Categorías importadas correctamente");
    } catch {
      message.error("Error al importar archivo");
    } finally {
      e.target.value = "";
    }
  };

  const handleCreateSublevel = async (values: any) => {
    const levels = values.path
      .split(">")
      .map((l: string) => l.trim())
      .filter(Boolean);
    if (!levels.length) { message.error("Ruta inválida"); return; }
    await createHierarchy(selectedCategory!.id, levels);
    message.success("Subnivel creado");
    hierarchyForm.resetFields();
    setHierarchyModalOpen(false);
    await reload();
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    Modal.confirm({
      title: "Eliminar categoría",
      content: "¿Seguro que deseas eliminar esta categoría?",
      onOk: async () => {
        await toggleActive(selectedCategory.id, !selectedCategory.active);
        message.success("Categoría eliminada");
        setSelectedCategory(null);
      },
    });
  };

  const exportMenu: MenuProps = {
    items: [
      {
        key: "excel",
        label: "Exportar Excel",
        onClick: () => exportCategoriesToExcel(categoryTree),
      },
      {
        key: "pdf",
        label: "Exportar PDF",
        onClick: () => exportCategoriesToPDF(categoryTree),
      },
      {
        key: "import",
        label: "Importar Excel",
        onClick: () => fileInputRef.current?.click(),
      },
    ],
  };

  const categoryActions = selectedCategory ? (
    isMobile ? (
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          padding: "10px 12px",
          background: "#f6f8fa",
          borderRadius: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Tag
          color={selectedCategory.active ? "green" : "red"}
          style={{ marginRight: "auto" }}
        >
          {selectedCategory.name} · {selectedCategory.active ? "Activa" : "Inactiva"}
        </Tag>
        <ProtectedButton
          roles={getAllowedRoles("category", "create")}
          icon={<SubnodeOutlined />}
          size="small"
          onClick={openCreateSublevel}
        >
          Subnivel
        </ProtectedButton>
        <ProtectedButton
          roles={getAllowedRoles("category", "edit")}
          icon={<EditOutlined />}
          size="small"
          onClick={openEdit}
        >
          Editar
        </ProtectedButton>
        <ProtectedButton
          danger
          roles={getAllowedRoles("category", "delete")}
          icon={<DeleteOutlined />}
          size="small"
          onClick={handleDelete}
        >
          Eliminar
        </ProtectedButton>
      </div>
    ) : (
      <Space style={{ marginBottom: 12 }}>
        <ProtectedButton
          roles={getAllowedRoles("category", "create")}
          disabled={!selectedCategory}
          onClick={openCreateSublevel}
        >
          Crear subnivel
        </ProtectedButton>
        <ProtectedButton
          roles={getAllowedRoles("category", "edit")}
          disabled={!selectedCategory}
          onClick={openEdit}
        >
          Editar
        </ProtectedButton>
        <ProtectedButton
          danger
          roles={getAllowedRoles("category", "delete")}
          disabled={!selectedCategory}
          onClick={handleDelete}
        >
          Eliminar
        </ProtectedButton>
        <Tag color={selectedCategory.active ? "green" : "red"}>
          {selectedCategory.active ? "Activa" : "Inactiva"}
        </Tag>
      </Space>
    )
  ) : (
    !isMobile ? (
      <Space style={{ marginBottom: 12 }}>
        <Button disabled>Crear subnivel</Button>
        <Button disabled>Editar</Button>
        <Button danger disabled>Eliminar</Button>
      </Space>
    ) : null
  );

  return (
    <>
      <PageHeader
        title="Categorías"
        extra={
          isMobile ? (
            <Space size={6}>
              <ProtectedButton
                roles={getAllowedRoles("category", "create")}
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={openCreate}
              >
                Nueva
              </ProtectedButton>
              <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          ) : (
            <Space>
              <Button size={sizes.button} onClick={() => exportCategoriesToExcel(categoryTree)}>
                Exportar Excel
              </Button>
              <Button size={sizes.button} onClick={() => exportCategoriesToPDF(categoryTree)}>
                Exportar PDF
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                Importar Excel
              </Button>
              <ProtectedButton
                roles={getAllowedRoles("category", "create")}
                type="primary"
                onClick={openCreate}
              >
                Nueva categoría raíz
              </ProtectedButton>
            </Space>
          )
        }
      />

      <input
        type="file"
        accept=".xlsx"
        hidden
        ref={fileInputRef}
        onChange={handleFile}
      />

      <Row style={{ padding: isMobile ? 0 : sizes.cardPadding }}>
        <Col span={24}>
          <Card
            title="Estructura de Categorías"
            size={isMobile ? "small" : "default"}
            bodyStyle={{ padding: isMobile ? "8px 12px" : undefined }}
          >
            {categoryActions}

            <div style={{ overflowX: "auto" }}>
              <CategoryTreeView
                categoryTree={categoryTree}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <FormModal
        open={modalOpen}
        title={editing ? "Editar categoría" : "Nueva categoría raíz"}
        onClose={() => setModalOpen(false)}
        mobileHeight="auto"
      >
        <CreateEditCategoryForm
          initialValues={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </FormModal>

      <FormModal
        open={hierarchyModalOpen}
        title={`Crear subnivel en "${selectedCategory?.name}"`}
        onClose={() => setHierarchyModalOpen(false)}
        mobileHeight="auto"
      >
        <Form
          form={hierarchyForm}
          layout="vertical"
          onFinish={handleCreateSublevel}
        >
          <Form.Item
            name="path"
            label="Ruta jerárquica"
            rules={[{ required: true, message: "Ingrese la ruta jerárquica" }]}
          >
            <Input placeholder="Nivel1 > Nivel2 > Nivel3" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Crear
            </Button>
          </Form.Item>
        </Form>
      </FormModal>
    </>
  );
}