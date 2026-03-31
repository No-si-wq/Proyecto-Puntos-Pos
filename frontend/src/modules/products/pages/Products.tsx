import { useState, useMemo, useEffect } from "react";
import { message, Tooltip, Form, Button, Upload, Badge, Tag, Dropdown, Typography, Space, Input, type MenuProps } from "antd";
import { TagsOutlined, ReloadOutlined, MoreOutlined, PlusOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import type { Product } from "../types/product";

import { useProducts } from "../hooks/useProducts";
import FormModal from "../../../core/components/forms/FormModal";

import PageHeader from "../../../core/components/common/PageHeader";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import ProductForm from "../components/ProductForm";
import ProductPricesModal from "../components/ProductPricesModal";
import SimpleTable from "../../../core/components/table/SimpleTable";
import { buildCategoryPath, buildCategoryBreadcrumb } from "../../../core/utils/category";

import { getAllowedRoles } from "../../../core/utils/permissions";
import { useCategories } from "../../categories/useCategories";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

import ReorderPointModal from "../components/ReorderPointModal";

const { Text } = Typography;

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
  const { isMobile } = useDeviceType();

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

  function getProductMenu(record: Product): MenuProps {
    return {
      items: [
        { key: "edit",    label: "Editar",          icon: <TagsOutlined />,  onClick: () => openEdit(record)    },
        { key: "prices",  label: "Listas de precios", icon: <TagsOutlined />, onClick: () => openPrices(record)  },
        { key: "reorder", label: "Punto de reorden", icon: <ReloadOutlined />, onClick: () => openReorder(record) },
        { type: "divider" as const },
        {
          key: "toggle", danger: record.active,
          label: record.active ? "Desactivar" : "Activar",
          onClick: () => confirmToggle(record),
        },
      ],
    };
  }
 
  const toolsMenu: MenuProps = {
    items: [
      { key: "excel",  label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",    label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
      { key: "import", label: "Importar Excel", icon: <FileExcelOutlined />,
        onClick: () => document.getElementById("products-import-input")?.click() },
    ],
  };
 
  const desktopColumns: ColumnsType<Product> = [
    { title: "SKU",    dataIndex: "sku"  },
    { title: "Nombre", dataIndex: "name" },
    { title: "LB", dataIndex: "laboratory", render: (v: string) => v !== null ? v : "-" },
    { title: "Costo",  dataIndex: "cost" },
    { title: "Precio", dataIndex: "price" },
    {
      title: "Obs.",
      dataIndex: "observations",
      render: (v: string) => v
        ? (
          <Tooltip title={<span style={{ whiteSpace: "pre-wrap" }}>{v}</span>}>
            <FileTextOutlined style={{ color: "#1677ff", cursor: "pointer", fontSize: 16 }} />
          </Tooltip>
        )
        : <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    { title: "Impuesto", dataIndex: "tax", render: (v: number) => v != null ? `${(v * 100).toFixed(0)}%` : "—" },
    {
      title: "Categoría",
      render: (_, record) => {
        const text = buildCategoryBreadcrumb(categoryTree, record.categoryId);
        return <Tooltip title={text}><span>{text}</span></Tooltip>;
      },
    },
    {
      title: "Mínimo Stock", dataIndex: "reorderPoint",
      render: (value: number) => value > 0
        ? <Badge count={value} style={{ backgroundColor: "#faad14" }} overflowCount={9999} />
        : <span style={{ color: "#bfbfbf" }}>—</span>,
    },
    { title: "Activo", dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    {
      title: "Acciones",
      render: (_, record) => (
        <>
          <ProtectedButton roles={getAllowedRoles("products", "edit")} onClick={() => openEdit(record)}>Editar</ProtectedButton>
          <Tooltip title="Listas de precios">
            <ProtectedButton roles={getAllowedRoles("products", "edit")} icon={<TagsOutlined />} onClick={() => openPrices(record)}>Precios</ProtectedButton>
          </Tooltip>
          <Tooltip title="Punto de reorden">
            <ProtectedButton roles={getAllowedRoles("products", "edit")} icon={<ReloadOutlined />} onClick={() => openReorder(record)}>Reorden</ProtectedButton>
          </Tooltip>
          <ProtectedButton roles={getAllowedRoles("products", "delete")} danger onClick={() => confirmToggle(record)}>
            {record.active ? "Desactivar" : "Activar"}
          </ProtectedButton>
        </>
      ),
    },
  ];
 
  const mobileColumns: ColumnsType<Product> = [
    {
      title: "Producto",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.sku}</Text>
          <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Tag color={r.active ? "green" : "default"}>{r.active ? "Activo" : "Inactivo"}</Tag>
            {r.reorderPoint > 0 && (
              <Badge count={r.reorderPoint} style={{ backgroundColor: "#faad14" }} overflowCount={9999} />
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Precio",
      align: "right",
      render: (_, r) => (
        <div style={{ textAlign: "right" }}>
          <Text strong style={{ display: "block" }}>{r.price}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>Costo: {r.cost}</Text>
          <div style={{ marginTop: 4 }}>
            <Dropdown menu={getProductMenu(r)} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" style={{ border: "none", boxShadow: "none" }} />
            </Dropdown>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Gestión de productos"
        extra={
          isMobile ? (
            <Space size={6}>
              <ProtectedButton
                roles={getAllowedRoles("products", "create")}
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={openCreate}
              >
                Nuevo
              </ProtectedButton>
              <Dropdown menu={toolsMenu} trigger={["click"]} placement="bottomRight">
                <Button icon={<MoreOutlined />} size="small" />
              </Dropdown>
            </Space>
          ) : (
            <Space wrap>
              <Button onClick={handleExportExcel} size={sizes.button}>Exportar Excel</Button>
              <Button onClick={handleExportPdf} size={sizes.button}>Exportar PDF</Button>
              <Upload beforeUpload={handleImport} showUploadList={false} accept=".xlsx,.xls">
                <Button size={sizes.button}>Importar Excel</Button>
              </Upload>
              <Text strong>Activos: {products.filter(p => p.active).length}</Text>
              <ProtectedButton roles={getAllowedRoles("products", "create")} type="primary" onClick={openCreate}>
                Nuevo producto
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
      </div>

      <input
        id="products-import-input"
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }}
      />

      <SimpleTable<Product> 
        data={products} 
        columns={desktopColumns}
        mobileColumns={mobileColumns} 
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