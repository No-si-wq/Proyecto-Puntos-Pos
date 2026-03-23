import { useState, useMemo, useEffect } from "react";
import { message, Tooltip, Form, Button, Row, Col, Upload, Badge, Input } from "antd";
import { TagsOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import type { Product } from "./product";

import { useProducts } from "./useProducts";
import FormModal from "../../core/components/forms/FormModal";

import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../core/components/common/ConfirmModal";
import ProductForm from "./components/ProductForm";
import ProductPricesModal from "./components/ProductPricesModal";
import SimpleTable from "../../core/components/table/SimpleTable";
import { buildCategoryPath, buildCategoryBreadcrumb } from "../../core/utils/category";

import { getAllowedRoles } from "../../core/utils/permissions";
import { useCategories } from "../categories/useCategories";
import { exportToPdf } from "../../core/utils/exportPDF";
import { exportToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";

import ReorderPointModal from "./components/ReorderPointModal";

export default function Products() {
  const {
    products,
    loading,
    create,
    update,
    toggleActive,
    importExcel,
    reorderPoints,
    setFilters,
  } = useProducts();

  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<Product>();
  const [searchValue, setSearchValue] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const sizes = useResponsiveSizes();
  const { categoryTree } = useCategories();

  const [pricesOpen, setPricesOpen] = useState(false);
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null);

  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({
        search: searchValue || undefined,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  function buildBreadcrumbFromId(categoryId: number) {
    const path = buildCategoryPath(categoryTree, categoryId);
    return path.map(c => c.name).join(" > ");
  }

  async function handleImport(file: File) {
    try {
      await importExcel(file);
      message.success("Productos importados correctamente");
    } catch {
      message.error("Error importando productos");
    }
    return false;
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
    exportToExcel(buildExportRows(products), "Productos");
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

  const formInitialValues = useMemo<Partial<Product> | undefined>(() => {
    if (!editing || !categoryTree.length) return undefined;

    const path = buildCategoryPath(categoryTree, editing.categoryId);

    return {
      sku: editing.sku,
      name: editing.name,
      description: editing.description,
      price: editing.price,
      cost: editing.cost,
      tax: editing.tax != null ? Number(editing.tax) * 100 : undefined,
      barcodes: editing.barcodes ?? undefined,
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

  function openPrices(product: Product) {
    setPricingProduct(product);
    setPricesOpen(true);
  }

  function openReorder(product: Product) {
    setReorderProduct(product);
    setReorderOpen(true);
  }

  async function handleSaveReorderPoint(productId: number, reorderPoint: number) {
    try {
      await reorderPoints(productId, reorderPoint);
      message.success("Punto de reorden actualizado");
    } catch {
      message.error("Error actualizando punto de reorden");
    }
  }

  async function submit(values: any) {
    if (!values.categoryPath || values.categoryPath.length === 0) {
      message.error("Debes seleccionar una categoria");
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
        tax: values.tax != null ? values.tax / 100 : values.tax,
        active: values.active,
        categoryId,
        ...(values.barcodes !== undefined && {
          barcodes: values.barcodes,
        }),
      };

      if (editing) {
        await update(editing.id, payload);
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
      title: product.active ? "Desactivar producto" : "Activar producto",
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
    { title: "Impuesto", dataIndex: "tax", render: (v: number) => v != null ? `${(v * 100).toFixed(0)}%` : "—" },
    {
      title: "Categoría",
      render: (_, record) => {
        const text = buildCategoryBreadcrumb(categoryTree, record.categoryId);
        return (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Mínimo Stock", dataIndex: "reorderPoint",
      render: (value: number) => value > 0
        ? <Badge count={value} style={{ backgroundColor: "#faad14" }} overflowCount={9999} />
        : <span style={{ color: "#bfbfbf" }}>—</span>,
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

          <Tooltip title="Listas de precios">
            <ProtectedButton
              roles={getAllowedRoles("products", "edit")}
              icon={<TagsOutlined />}
              onClick={() => openPrices(record)}
            >
              Lista Precios
            </ProtectedButton>
          </Tooltip>

          <Tooltip title="Punto de reorden">
            <ProtectedButton 
              roles={getAllowedRoles("products", "edit")} 
              icon={<ReloadOutlined />} 
              onClick={() => openReorder(record)}
            >
              Reorden
            </ProtectedButton>
          </Tooltip>

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
              <Button type="default" onClick={handleExportExcel} size={sizes.button}>
                Exportar Excel
              </Button>
            </Col>
            <Col>
              <Button type="default" onClick={handleExportPdf} size={sizes.button}>
                Exportar PDF
              </Button>
            </Col>
            <Col>
              <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx,.xls">
                <Button size={sizes.button}>Importar Excel</Button>
              </Upload>
            </Col>
          </Row>
        </Col>

        <Col>
          <strong>Activos: {products.filter(p => p.active).length}</strong>
        </Col>
      </Row>

      <SimpleTable<Product> data={products} columns={columns} loading={loading} />

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

      {pricingProduct && (
        <ProductPricesModal
          open={pricesOpen}
          onClose={() => { setPricesOpen(false); setPricingProduct(null); }}
          productId={pricingProduct.id}
          productName={pricingProduct.name}
        />
      )}

      {reorderProduct && (
        <ReorderPointModal
          open={reorderOpen}
          onClose={() => { setReorderOpen(false); setReorderProduct(null); }}
          productId={reorderProduct.id}
          productName={reorderProduct.name}
          currentReorderPoint={reorderProduct.reorderPoint ?? 0}
          onSave={handleSaveReorderPoint}
        />
      )}
    </>
  );
}