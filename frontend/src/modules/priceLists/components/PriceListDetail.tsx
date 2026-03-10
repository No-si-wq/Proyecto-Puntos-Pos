import { Table, Button, Space, Popconfirm, Typography, Skeleton } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { PriceListDetail as PriceListDetailType, ProductPrice } from "../pricelist";
import { formatCurrency } from "../../../core/utils/formatters";

const { Text } = Typography;

interface Props {
  detail: PriceListDetailType | null;
  loading: boolean;
  onEditPrice: (pp: ProductPrice) => void;
  onRemovePrice: (productId: number) => void;
}

export function PriceListDetail({ detail, loading, onEditPrice, onRemovePrice }: Props) {
  if (loading) return <Skeleton active />;
  if (!detail) return null;

  const columns = [
    {
      title: "SKU",
      key: "sku",
      render: (_: any, record: ProductPrice) => (
        <Text code>{record.product?.sku ?? "—"}</Text>
      ),
    },
    {
      title: "Producto",
      key: "name",
      render: (_: any, record: ProductPrice) => record.product?.name ?? "—",
    },
    {
      title: "Precio base",
      key: "basePrice",
      render: (_: any, record: ProductPrice) =>
        record.product ? formatCurrency(record.product.price) : "—",
    },
    {
      title: "Precio lista",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <Text strong style={{ color: "#1677ff" }}>
          {formatCurrency(price)}
        </Text>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_: any, record: ProductPrice) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEditPrice(record)}
          />
          <Popconfirm
            title="¿Eliminar este precio?"
            onConfirm={() => onRemovePrice(record.productId)}
            okText="Sí"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={detail.prices}
      pagination={{ pageSize: 20 }}
      size="small"
    />
  );
}