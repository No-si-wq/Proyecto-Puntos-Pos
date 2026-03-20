import { useEffect, useState } from "react";
import { Modal, Form, InputNumber, Select, Alert, Typography } from "antd";
import { useTransferProduct } from "../hooks/useTransferProduct";
import { useRequiredWarehouse } from "../../warehouses/useRequiredWarehouse";
import { useWarehouseProducts } from "../../warehouses/useWarehouseProducts";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: { id: number; name: string; sku: string; stock: number } | null;
}

export default function TransferProductModal({ open, onClose, onSuccess, product }: Props) {
  const [form] = Form.useForm();
  const warehouseId = useRequiredWarehouse();
  const { products } = useWarehouseProducts();
  const { transfer, loading } = useTransferProduct();

  const [quantity, setQuantity] = useState<number | null>(null);
  const [factor, setFactor] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setQuantity(null);
      setFactor(null);
    }
  }, [open, product?.id]);

  const resultQuantity =
    quantity && factor ? quantity * factor : null;

  async function handleOk() {
    const values = await form.validateFields();

    if (!product || !warehouseId) return;

    const ok = await transfer({
      fromProductId: product.id,
      toProductId: values.toProductId,
      warehouseId,
      quantity: values.quantity,
      factor: values.factor,
    });

    if (ok) {
      onClose();
      onSuccess();
    }
  }

  const productOptions = (products ?? [])
    .filter((p) => p.active && p.id !== product?.id)
    .map((p) => ({ label: `${p.name} · Stock: ${p.stock}`, value: p.id }));

  return (
    <Modal
      title={`Transferir a otro producto — ${product?.name ?? ""}`}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Transferir"
      cancelText="Cancelar"
      confirmLoading={loading}
      destroyOnClose
    >
      {product && (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`Stock disponible: ${product.stock} unidades`}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="toProductId"
          label="Producto destino"
          rules={[{ required: true, message: "Seleccione el producto destino" }]}
        >
          <Select
            showSearch
            placeholder="Buscar producto..."
            optionFilterProp="label"
            options={productOptions}
            notFoundContent="No hay otros productos disponibles"
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Cantidad a transferir (en unidad origen)"
          rules={[
            { required: true, message: "Ingrese la cantidad" },
            { type: "number", min: 1, message: "Debe ser mayor a 0" },
            {
              validator: (_, value) => {
                if (value && product && value > product.stock) {
                  return Promise.reject(
                    new Error(`No puede transferir más de ${product.stock}`)
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            min={1}
            max={product?.stock ?? undefined}
            style={{ width: "100%" }}
            placeholder="Ej. 2"
            onChange={(v) => setQuantity(v)}
          />
        </Form.Item>

        <Form.Item
          name="factor"
          label="Factor de conversión (unidades destino por unidad origen)"
          rules={[
            { required: true, message: "Ingrese el factor" },
            { type: "number", min: 1, message: "Debe ser mayor a 0" },
          ]}
          extra="Ej: si 1 caja = 12 unidades, ingrese 12"
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Ej. 12"
            onChange={(v) => setFactor(v)}
          />
        </Form.Item>

        {resultQuantity !== null && (
          <Alert
            type="success"
            showIcon
            message={
              <Text>
                Se agregarán <Text strong>{resultQuantity} unidades</Text> al producto destino
                a partir de <Text strong>{quantity} unidades</Text> del producto origen
              </Text>
            }
          />
        )}
      </Form>
    </Modal>
  );
}