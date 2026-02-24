import { useState, useMemo } from "react";
import { message, Tooltip, Form, Button, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Product, ProductFormValues } from "../../types/product";

import { useProducts } from "../../hooks/useProducts";
import FormModal from "../../components/forms/FormModal";

import PageHeader from "../../components/common/PageHeader";
import ProtectedButton from "../../components/common/ProtectedButton";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import ProductForm from "../../components/forms/ProductForm";
import SimpleTable from "../../components/tables/SimpleTable";
import { formatCategoryBreadcrumb } from "../../utils/category";
import { buildCategoryPathFromMap } from "../../utils/category";

import { getAllowedRoles } from "../../utils/permissions";
import { buildCategoryPath } from "../../utils/category";
import { useCategories } from "../../hooks/useCategories";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

export default function Products() {
  const {
    products,
    loading,
    create,
    update,
    toggleActive,
  } = useProducts();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<ProductFormValues>();
  const [editing, setEditing] = useState<Product | null>(null);
  const sizes = useResponsiveSizes();
  const { categoryTree } = useCategories();
    useState<Product | null>(null);
  const categoryMap = new Map(categoryTree.map(c => [c.id, c]));

  function buildBreadcrumbFromId(categoryId: number) {
    const path = buildCategoryPathFromMap(categoryMap, categoryId);
    return path.map(c => c.name).join(" > ");
  }

  function buildExportRows(data: Product[]) {
    return data
      .filter(p => p.active)
      .map((p) => ({
      Codigo: p.sku,
      Nombre: p.name,
      Descripcion: p.description ?? "-",
      Precio: p.price,
      Costo: p.cost,
      Categorias: buildBreadcrumbFromId(p.categoryId),
      }));
  }

  function handleExportExcel() {
    exportToExcel(
      buildExportRows(products),
      "Productos"
    );
  }

  function handleExportPdf() {
    exportToPdf(
      "Productos",
      [
        { header: "Codigo", dataKey: "Codigo" },
        { header: "Nombre", dataKey: "Nombre" },
        { header: "Descripcion", dataKey: "Descripcion" },
        { header: "Precio", dataKey: "Precio" },
        { header: "Costo", dataKey: "Costo" },
        { header: "Categorias", dataKey: "Categorias" },
      ],
      buildExportRows(products),
      "Productos"
    );
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  const formInitialValues = useMemo<ProductFormValues | undefined>(() => {
    if (!editing || !categoryTree.length) return undefined

    const path = buildCategoryPath(categoryTree, editing.categoryId);

    return {
      sku: editing.sku,
      name: editing.name,
      description: editing.description,
      price: editing.price,
      cost: editing.cost,
      barcodes: editing.barcodes,
      categoryPath: path.map(c => c.id),
      active: editing.active,
    };
  }, [editing, categoryTree]);

  function openEdit(product: Product) {
    setEditing({
      ...product,
      price: Number(product.price),
      cost: Number(product.cost),
    });
    setOpen(true);
  }

  async function submit(values: ProductFormValues) {
    if (!values.categoryPath || values.categoryPath.length === 0) {
      message.error("Debes seleccionar una categoría");
      return;
    }

    try {
      const categoryId = values.categoryPath[values.categoryPath.length - 1];
      const payload = {
        sku: values.sku,
        name: values.name,
        description: values.description,
        price: values.price,
        cost: values.cost,
        categoryId,
        ...(values.barcodes !== undefined && {
          barcodes: values.barcodes,
        }),
      };

      if (editing) {
        await update(editing.id, { ...payload, active: values.active });
        message.success("Producto actualizado");
      } else {
        await create(payload);
        message.success("Producto creado");
      }
      setOpen(false);
    } catch (error: any) {
      if (error.response?.status === 409) {
        const duplicatedCode = error.response.data.code;

        const index = form
          .getFieldValue("barcodes")
          ?.findIndex((c: string) => c === duplicatedCode);

        if (index !== -1) {
          form.setFields([
            {
              name: ["barcodes", index],
              errors: ["Este código ya existe en otro producto"],
            },
          ]);
        }

        message.error("Código de barras duplicado");
        return;
      }

      message.error("Error guardando producto");
    }
  }

  function confirmToggle(product: Product) {
    ConfirmModal({
      title: product.active
        ? "Desactivar producto"
        : "Activar producto",
      content: `¿Seguro que deseas ${
        product.active ? "desactivar" : "activar"
      } ${product.name}?`,
      danger: product.active,
      onConfirm: async () => {
        await toggleActive(product.id, !product.active);
        message.success("Estado actualizado");
      },
    });
  }

  const columns: ColumnsType<Product> = [
    { title: "SKU", dataIndex: "sku" },
    { title: "Nombre", dataIndex: "name" },
    { title: "Costo", dataIndex: "cost" },
    { title: "Precio", dataIndex: "price" },
    {
      title: "Categoría",
      render: (_, record) => {
        const text = formatCategoryBreadcrumb(record.category);
        return (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        );
      }
    },
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
            roles={getAllowedRoles("products", "edit")}
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>

          <ProtectedButton
            roles={getAllowedRoles("products", "delete")}
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
        title="Productos"
        subtitle="Gestión de productos"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("products", "create")}
            type="primary"
            onClick={openCreate}
          >
            Nuevo producto
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
            Activos: {products.filter(p => p.active).length}
          </strong>
        </Col>
      </Row>

      <SimpleTable<Product>
        data={products}
        columns={columns}
        loading={loading}
      />

      <FormModal
        open={open}
        title={editing ? "Editar producto" : "Nuevo producto"}
        onClose={() => setOpen(false)}
      >
        <ProductForm 
          isEdit={!!editing}
          initialValues={formInitialValues}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormModal>
    </>
  );
}