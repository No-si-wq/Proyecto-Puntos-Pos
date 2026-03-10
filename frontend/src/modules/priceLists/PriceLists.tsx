import { useState } from "react";
import { Table, Button, Tag, Space, Drawer, Typography, Tooltip } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import PageHeader from "../../core/components/common/PageHeader";
import ProtectedButton from "../../core/components/common/ProtectedButton";
import FormModal from "../../core/components/forms/FormModal";
import { PriceListForm } from "./components/PriceListForm";
import { ProductPriceForm } from "./components/ProductPriceForm";
import { PriceListDetail } from "./components/PriceListDetail";
import { usePriceLists, usePriceListDetail } from "./usePriceList";
import type { PriceList, ProductPrice } from "./pricelist";
import { useProducts } from "../products/useProducts";
import { getAllowedRoles } from "../../core/utils/permissions";

const { Text } = Typography;

export default function PriceLists() {
  const { priceLists, loading, create, update, remove } = usePriceLists();

  const { products } = useProducts();

  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<PriceList | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [editPrice, setEditPrice]       = useState<ProductPrice | null>(null);
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

  const columns = [
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
        active ? <Tag color="green">Activa</Tag> : <Tag color="default">Inactiva</Tag>,
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
            Nueva lista
          </ProtectedButton>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={priceLists}
        loading={loading}
        pagination={{ pageSize: 15 }}
      />

      <FormModal
        open={formOpen}
        title={editTarget ? "Editar lista de precios" : "Nueva lista de precios"}
        onClose={() => setFormOpen(false)}
      >
        <PriceListForm
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          initial={editTarget}
        />
      </FormModal>

      <Drawer
        title={detail?.name ?? "Lista de precios"}
        open={detailOpen}
        onClose={closeDetail}
        width={680}
        extra={
          <ProtectedButton
            roles={getAllowedRoles("priceList", "create")}
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddPrice}
            disabled={allAssigned}
          >
            Agregar precio
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