import { useState } from "react";
import { Table, Tag, Space, Typography, Skeleton, Empty } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import FormModal from "../../../core/components/forms/FormModal";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import { ConfirmModal } from "../../../core/components/common/ConfirmModal";
import { getAllowedRoles } from "../../../core/utils/permissions";
import { useProductPrices } from "../useProducts";
import { usePriceLists } from "../../priceLists/usePriceList";
import ProductPriceForm from "./ProductPriceForm";
import type { ProductPrice } from "../../priceLists/pricelist";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

export default function ProductPricesModal({ open, onClose, productId, productName }: Props) {
  const { prices = [], loading, upsertPrice, removePrice } = useProductPrices(productId, open);
  const { priceLists = [] } = usePriceLists();

  const [priceFormOpen, setPriceFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);

  function openAdd() {
    setEditingPrice(null);
    setPriceFormOpen(true);
  }

  function openEdit(pp: ProductPrice) {
    setEditingPrice(pp);
    setPriceFormOpen(true);
  }

  function confirmRemove(pp: ProductPrice) {
    ConfirmModal({
      title: "Eliminar precio",
      content: `¿Eliminar el precio de "${pp.priceList?.name}" para este producto?`,
      danger: true,
      onConfirm: () => removePrice(pp.priceListId),
    });
  }

  async function handlePriceSubmit(values: { priceListId: number; price: number }) {
    await upsertPrice(values);
    setPriceFormOpen(false);
  }

  const columns = [
    {
      title: "Lista de precios",
      key: "priceList",
      render: (_: any, record: ProductPrice) => (
        <Tag color={record.priceList?.active ? "blue" : "default"}>
          {record.priceList?.name ?? `Lista #${record.priceListId}`}
        </Tag>
      ),
    },
    {
      title: "Precio lista",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <Text strong>L {Number(price).toFixed(2)}</Text>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: ProductPrice) => (
        <Space>
          <ProtectedButton
            roles={getAllowedRoles("products", "edit")}
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Editar
          </ProtectedButton>
          <ProtectedButton
            roles={getAllowedRoles("products", "delete")}
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => confirmRemove(record)}
          >
            Eliminar
          </ProtectedButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <FormModal
        open={open}
        title={`Precios — ${productName}`}
        onClose={onClose}
      >
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
          <ProtectedButton
            roles={getAllowedRoles("products", "edit")}
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={openAdd}
          >
            Agregar precio
          </ProtectedButton>
        </div>

        {loading ? (
          <Skeleton active />
        ) : prices.length === 0 ? (
          <Empty description="Sin precios en listas" />
        ) : (
          <Table
            rowKey="priceListId"
            columns={columns}
            dataSource={prices}
            pagination={false}
            size="small"
          />
        )}
      </FormModal>

      <FormModal
        open={priceFormOpen}
        title={editingPrice ? "Editar precio" : "Agregar a lista de precios"}
        onClose={() => setPriceFormOpen(false)}
      >
        <ProductPriceForm
          productId={productId}
          priceLists={priceLists}
          onSubmit={handlePriceSubmit}
          onCancel={() => setPriceFormOpen(false)}
          initial={editingPrice}
          existingPriceListIds={prices.map((p) => p.priceListId)}
        />
      </FormModal>
    </>
  );
}
