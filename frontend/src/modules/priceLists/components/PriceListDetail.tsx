import { Table, Button, Space, Popconfirm, Typography, Skeleton, Dropdown } from "antd";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { PriceListDetail as PriceListDetailType, ProductPrice } from "../pricelist";
import { formatCurrency } from "../../../core/utils/formatters";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

const { Text } = Typography;

interface Props {
  detail: PriceListDetailType | null;
  loading: boolean;
  onEditPrice: (pp: ProductPrice) => void;
  onRemovePrice: (productId: number) => void;
}

export function PriceListDetail({ detail, loading, onEditPrice, onRemovePrice }: Props) {
  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  if (loading) return <Skeleton active />;
  if (!detail) return null;

  const getActionMenu = (record: ProductPrice): MenuProps => ({
    items: [
      {
        key: "edit",
        label: "Editar precio",
        icon: <EditOutlined />,
        onClick: () => onEditPrice(record),
      },
      {
        key: "delete",
        label: "Eliminar",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          if (window.confirm("¿Eliminar este precio?")) {
            onRemovePrice(record.productId);
          }
        },
      },
    ],
  });

  const desktopColumns = [
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

  const mobileColumns = [
    {
      title: "Producto",
      key: "product",
      render: (_: any, record: ProductPrice) => (
        <div>
          <Text strong style={{ display: "block" }}>
            {record.product?.name ?? "—"}
          </Text>
          <Text code style={{ fontSize: 11 }}>
            {record.product?.sku ?? "—"}
          </Text>
        </div>
      ),
    },
    {
      title: "Precios",
      key: "prices",
      render: (_: any, record: ProductPrice) => (
        <div style={{ textAlign: "right" }}>
          <Text strong style={{ color: "#1677ff", display: "block" }}>
            {formatCurrency(record.price)}
          </Text>
          {record.product && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Base: {formatCurrency(record.product.price)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: ProductPrice) => (
        <Dropdown
          menu={getActionMenu(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
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
    <Table
      rowKey="id"
      columns={isCompact ? mobileColumns : desktopColumns}
      dataSource={detail.prices}
      pagination={{ pageSize: 20, simple: isCompact }}
      size="small"
      scroll={isTablet ? { x: true } : undefined}
    />
  );
}