import { useEffect, useState } from "react";
import { Modal, Form, Select, Alert, Table, InputNumber, Typography } from "antd";
import { useTransferWarehouse } from "../hooks/useTransferWarehouse";
import { useWarehouses } from "../../warehouses/hooks/useWarehouse";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";
import { useInventoryList } from "../hooks/useInventoryList";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedItem {
  productId: number;
  quantity: number;
  maxQuantity: number;
  name: string;
}

export default function TransferWarehouseModal({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const fromWarehouseId = useRequiredWarehouse();
  const { warehouses } = useWarehouses();
  const { data: inventory, loading: inventoryLoading } = useInventoryList();
  const { transfer, loading } = useTransferWarehouse(() => {
    onSuccess();
    onClose();
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedItems([]);
    }
  }, [open]);

  function handleProductSelect(productIds: number[]) {
    setSelectedItems((prev) => {
      // Mantener cantidades ya ingresadas para productos que siguen seleccionados
      const prevMap = new Map(prev.map((i) => [i.productId, i]));

      return productIds.map((id) => {
        const product = inventory.find((p) => p.id === id)!;
        return prevMap.get(id) ?? {
          productId: id,
          name: product.name,
          quantity: 1,
          maxQuantity: product.stock,
        };
      });
    });
  }

  function handleQuantityChange(productId: number, value: number | null) {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: value ?? 1 }
          : item
      )
    );
  }

  async function handleOk() {
    const values = await form.validateFields();
    if (!fromWarehouseId) return;

    if (!selectedItems.length) {
      form.setFields([{ name: "productIds", errors: ["Seleccione al menos un producto"] }]);
      return;
    }

    await transfer({
      fromWarehouseId,
      toWarehouseId: values.toWarehouseId,
      items: selectedItems.map(({ productId, quantity }) => ({ productId, quantity })),
    });
  }

  const currentWarehouse = warehouses?.find((w) => w.id === fromWarehouseId);
  const destinationOptions = (warehouses ?? [])
    .filter((w) => w.id !== fromWarehouseId)
    .map((w) => ({ label: w.name, value: w.id }));

  const productOptions = inventory
    .filter((p) => p.active && p.stock > 0)
    .map((p) => ({ label: `${p.sku} - ${p.name} (Stock: ${p.stock})`, value: p.id }));

  return (
    <Modal
      title="Trasladar inventario de bodega"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Trasladar"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={640}
      destroyOnClose
    >
      {currentWarehouse && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`Bodega origen: ${currentWarehouse.name}`}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="toWarehouseId"
          label="Bodega destino"
          rules={[{ required: true, message: "Seleccione la bodega destino" }]}
        >
          <Select
            placeholder="Seleccionar bodega"
            options={destinationOptions}
            notFoundContent="No hay otras bodegas disponibles"
          />
        </Form.Item>

        <Form.Item
          name="productIds"
          label="Productos a transferir"
          rules={[{ required: true, message: "Seleccione al menos un producto" }]}
        >
          <Select
            mode="multiple"
            placeholder="Buscar y seleccionar productos"
            options={productOptions}
            loading={inventoryLoading}
            onChange={handleProductSelect}
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent="No hay productos con stock disponible"
          />
        </Form.Item>
      </Form>

      {selectedItems.length > 0 && (
        <Table
          size="small"
          pagination={false}
          dataSource={selectedItems}
          rowKey="productId"
          columns={[
            {
              title: "Producto",
              dataIndex: "name",
              render: (name) => <Text>{name}</Text>,
            },
            {
              title: "Cantidad a transferir",
              dataIndex: "quantity",
              width: 180,
              render: (_, record) => (
                <InputNumber
                  min={1}
                  max={record.maxQuantity}
                  value={record.quantity}
                  onChange={(val) => handleQuantityChange(record.productId, val)}
                  style={{ width: "100%" }}
                  addonAfter={<Text type="secondary">/ {record.maxQuantity}</Text>}
                />
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
}