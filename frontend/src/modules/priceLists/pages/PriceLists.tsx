import { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Drawer,
  Typography,
  Tooltip,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import PageHeader from "../../../core/components/common/PageHeader";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import FormModal from "../../../core/components/forms/FormModal";
import { PriceListForm } from "../components/PriceListForm";
import { ProductPriceForm } from "../components/ProductPriceForm";
import { PriceListDetail } from "../components/PriceListDetail";
import { usePriceLists } from "../hooks/usePriceList";
import { usePriceListDetail } from "../hooks/usePriceListDetail";
import type { PriceList, ProductPrice } from "../types/pricelist";
import { useProducts } from "../../products/hooks/useProducts";
import { getAllowedRoles } from "../../../core/utils/permissions";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

const { Text } = Typography;

export default function PriceLists() {
  const { priceLists, loading, create, update, remove } = usePriceLists();
  const { products } = useProducts();
  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<PriceList | null>(null);

  const [detailOpen, setDetailOpen]   = useState(false);
  const [selectedId, setSelectedId]   = useState<number | null>(null);

  const [editPrice, setEditPrice]         = useState<ProductPrice | null>(null);
  const [priceFormOpen, setPriceFormOpen] = useState(false);

  const { detail, loading: detailLoading, upsertPrice, removePrice } =
    usePriceListDetail(detailOpen ? selectedId : null);

  const openCreate   = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit     = (pl: PriceList) => { setEditTarget(pl); setFormOpen(true); };
  const openDetail   = (id: number) => { setSelectedId(id); setDetailOpen(true); };
  const closeDetail  = () => { setDetailOpen(false); setSelectedId(null); };

  const openAddPrice   = () => { setEditPrice(null); setPriceFormOpen(true); };
  const openEditPrice  = (pp: ProductPrice) => { setEditPrice(pp); setPriceFormOpen(true); };
  const closePriceForm = () => { setPriceFormOpen(false); setEditPrice(null); };

  const handleSubmit = async (values: any) => {
    if (editTarget) await update(editTarget.id, values);
    else await create(values);
    setFormOpen(false);
  };

  const assignedIds = new Set(detail?.prices?.map((p) => p.productId) ?? []);

  const availableProducts = products
    .filter((p) => p.active)
    .filter((p) => editPrice ? true : !assignedIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: Number(p.price) }));

  const allAssigned = products.filter((p) => p.active).length === assignedIds.size;

  const getActionMenu = (record: PriceList): MenuProps => ({
    items: [
      {
        key: "detail",
        label: "Ver productos",
        icon: <UnorderedListOutlined />,
        onClick: () => openDetail(record.id),
      },
      {
        key: "edit",
        label: "Editar",
        icon: <EditOutlined />,
        onClick: () => openEdit(record),
      },
      {
        key: "delete",
        label: "Eliminar",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => remove(record.id, record.active),
      },
    ],
  });

  const desktopColumns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      render: (d: string) => d || <Text type="secondary">—</Text>,
    },
    {
      title: "Productos",
      key: "count",
      render: (_: any, record: PriceList) => (
        <Tag>{record._count?.prices ?? 0} productos</Tag>
      ),
    },
    {
      title: "Estado",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) =>
        active
          ? <Tag color="green">Activa</Tag>
          : <Tag color="default">Inactiva</Tag>,
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: PriceList) => (
        <Space>
          <Tooltip title="Ver productos">
            <Button
              icon={<UnorderedListOutlined />}
              size="small"
              onClick={() => openDetail(record.id)}
            />
          </Tooltip>
          <ProtectedButton
            roles={getAllowedRoles("priceList", "edit")}
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>
          <ProtectedButton
            roles={getAllowedRoles("priceList", "delete")}
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => remove(record.id, record.active)}
          >
            Eliminar
          </ProtectedButton>
        </Space>
      ),
    },
  ];

  const mobileColumns = [
    {
      title: "Lista",
      key: "info",
      render: (_: any, record: PriceList) => (
        <div>
          <Text strong style={{ display: "block" }}>{record.name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
          <div style={{ marginTop: 6 }}>
            <Tag style={{ marginRight: 4 }}>
              {record._count?.prices ?? 0} productos
            </Tag>
            {record.active
              ? <Tag color="green">Activa</Tag>
              : <Tag color="default">Inactiva</Tag>
            }
          </div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: PriceList) => (
        <Dropdown menu={getActionMenu(record)} trigger={["click"]} placement="bottomRight">
          <Button
            icon={<MoreOutlined />}
            shape="circle"
            size="middle"
            style={{ border: "none", boxShadow: "none" }}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Listas de precios"
        extra={
          <ProtectedButton
            roles={getAllowedRoles("priceList", "create")}
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            {isMobile ? "Nueva" : "Nueva lista"}
          </ProtectedButton>
        }
      />

      <Table
        rowKey="id"
        columns={isMobile ? mobileColumns : desktopColumns}
        dataSource={priceLists}
        loading={loading}
        pagination={{ pageSize: 15, simple: isCompact }}
        size={isCompact ? "small" : "middle"}
        scroll={isTablet ? { x: true } : undefined}
      />

      <FormModal
        open={formOpen}
        title={editTarget ? "Editar lista de precios" : "Nueva lista de precios"}
        onClose={() => setFormOpen(false)}
      >
        <PriceListForm
          isEdit={!!editTarget}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          initial={editTarget}
        />
      </FormModal>

      <Drawer
        title={detail?.name ?? "Lista de precios"}
        open={detailOpen}
        onClose={closeDetail}
        width={isMobile ? "100%" : isTablet ? "80%" : 680}
        placement={isMobile ? "bottom" : "right"}
        height={isMobile ? "85vh" : undefined}
        styles={isMobile ? { body: { overflowY: "auto" } } : undefined}
        extra={
          <ProtectedButton
            roles={getAllowedRoles("priceList", "create")}
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddPrice}
            disabled={allAssigned}
            size={isMobile ? "small" : "middle"}
          >
            {isMobile ? "Agregar" : "Agregar precio"}
          </ProtectedButton>
        }
      >
        <PriceListDetail
          detail={detail}
          loading={detailLoading}
          onEditPrice={openEditPrice}
          onRemovePrice={removePrice}
        />
      </Drawer>

      <FormModal
        open={priceFormOpen}
        title={editPrice ? "Editar precio" : "Agregar precio a lista"}
        onClose={closePriceForm}
      >
        <ProductPriceForm
          initial={editPrice}
          products={availableProducts}
          onSubmit={async (data) => {
            await upsertPrice(data);
            closePriceForm();
          }}
          onCancel={closePriceForm}
        />
      </FormModal>
    </>
  );
}