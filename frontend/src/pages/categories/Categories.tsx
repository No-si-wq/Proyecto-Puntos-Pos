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
} from "antd";
import { useRef } from "react";
import type { Category } from "../../types/category";
import PageHeader from "../../components/common/PageHeader";
import ProtectedButton from "../../components/common/ProtectedButton";
import { getAllowedRoles } from "../../utils/permissions";
import FormModal from "../../components/forms/FormModal";
import CreateEditCategoryForm from "../../components/forms/CategoryForm";
import CategoryTreeView from "../../components/categories/CategoryTreeView";
import { useCategories } from "../../hooks/useCategories";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { parseCategoriesExcel } from "../../utils/categoryExport";
import { importCategories } from "../../api/category.api";
import {
  exportCategoriesToExcel,
  exportCategoriesToPDF,
} from "../../utils/categoryExport";
import { useDeviceType } from "../../hooks/useDeviceType";

export default function Categories() {
  const {
    categoryTree,
    reload,
    create,
    update,
    remove,
    createHierarchy,
  } = useCategories();

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType()

  const [hierarchyModalOpen, setHierarchyModalOpen] =
    useState(false);

  const [hierarchyForm] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = () => {
    if (!selectedCategory) return;
    setEditing(selectedCategory);
    setModalOpen(true);
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

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const paths = await parseCategoriesExcel(file);
      await importCategories(paths);
      await reload();
      message.success("Categorías importadas correctamente");
    } catch {
      message.error("Error al importar archivo");
    } finally {
      e.target.value = "";
    }
  };

  const openCreateSublevel = () => {
    if (!selectedCategory) return;
    setHierarchyModalOpen(true);
  };

  const handleCreateSublevel = async (values: any) => {
    const levels = values.path
      .split(">")
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (!levels.length) {
      message.error("Ruta inválida");
      return;
    }

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
      content:
        "¿Seguro que deseas eliminar esta categoría?",
      onOk: async () => {
        await remove(selectedCategory.id);
        message.success("Categoría eliminada");
        setSelectedCategory(null);
      },
    });
  };

  return (
    <>
      <PageHeader title="Categorías" />

      <Row style={{ padding: sizes.cardPadding }}>
        <Col span={24}>
          <Card
            title="Estructura de Categorías"
            extra={
              isMobile ? (
                <ProtectedButton
                  roles={getAllowedRoles("category", "create")}
                  type="primary"
                  block
                  onClick={openCreate}
                >
                  Nueva categoría raíz
                </ProtectedButton>
              ) : (
                <Space>
                  <Button
                    size={sizes.button}
                    onClick={() =>
                      exportCategoriesToExcel(categoryTree)
                    }
                  >
                    Exportar Excel
                  </Button>

                  <input
                    type="file"
                    accept=".xlsx"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFile}
                  />

                  <Button
                    size={sizes.button}
                    onClick={() =>
                      exportCategoriesToPDF(categoryTree)
                    }
                  >
                    Exportar PDF
                  </Button>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                  >
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
          >
            <Space 
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ marginBottom: 12, width: isMobile ? "100%" : undefined }}
            >
              <ProtectedButton
                roles={getAllowedRoles(
                  "category",
                  "create"
                )}
                block={isMobile}
                disabled={!selectedCategory}
                onClick={openCreateSublevel}
              >
                Crear subnivel
              </ProtectedButton>

              <ProtectedButton
                roles={getAllowedRoles(
                  "category",
                  "edit"
                )}
                block={isMobile}
                disabled={!selectedCategory}
                onClick={openEdit}
              >
                Editar
              </ProtectedButton>

              <ProtectedButton
                danger
                roles={getAllowedRoles(
                  "category",
                  "delete"
                )}
                block={isMobile}
                disabled={!selectedCategory}
                onClick={handleDelete}
              >
                Eliminar
              </ProtectedButton>

              {selectedCategory && (
                <Tag
                  style={isMobile ? {alignSelf: "flex-start"} : undefined}
                  color={ selectedCategory.active ? "green" : "red" }
                >
                  {selectedCategory.active ? "Activa" : "Inactiva"}
                </Tag>
              )}
            </Space>

            <div style={{ overflowX: "auto" }}>
              <CategoryTreeView
                categoryTree={categoryTree}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
              {isMobile && (
                <Space
                  direction="vertical"
                  style={{ marginTop: 16, width: "100%" }}
                >
                  <Button
                    block
                    onClick={() =>
                      exportCategoriesToExcel(categoryTree)
                    }
                  >
                    Exportar Excel
                  </Button>

                  <Button
                    block
                    onClick={() =>
                      exportCategoriesToPDF(categoryTree)
                    }
                  >
                    Exportar PDF
                  </Button>

                  <Button
                    block
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Importar Excel
                  </Button>
                </Space>
              )}
          </Card>
        </Col>
      </Row>

      <FormModal
        open={modalOpen}
        title={
          editing
            ? "Editar categoría"
            : "Nueva categoría raíz"
        }
        onClose={() => setModalOpen(false)}
      >
        <CreateEditCategoryForm
          initialValues={editing ?? undefined}
          isEdit={!!editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </FormModal>

      <Modal
        open={hierarchyModalOpen}
        title={`Crear subnivel en "${selectedCategory?.name}"`}
        footer={null}
        onCancel={() => setHierarchyModalOpen(false)}
        destroyOnClose
        width={isMobile ? "100%" : undefined}
        style={isMobile ? { top: 0 } : undefined }
      >
        <Form
          form={hierarchyForm}
          layout="vertical"
          onFinish={handleCreateSublevel}
        >
          <Form.Item
            name="path"
            label="Ruta jerárquica"
            rules={[
              {
                required: true,
                message:
                  "Ingrese la ruta jerárquica",
              },
            ]}
          >
            <Input placeholder="Nivel1 > Nivel2 > Nivel3" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
            >
              Crear
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}