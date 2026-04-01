import { useEffect } from "react";
import { Modal, Form, InputNumber, Select, Alert } from "antd";
import { useTransferInventory } from "../hooks/useTransferInventory";
import { useWarehouses } from "../../warehouses/hooks/useWarehouse";
import { useRequiredWarehouse } from "../../warehouses/hooks/useRequiredWarehouse";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: { id: number; name: string; sku: string; stock: number } | null;
}

export default function TransferInventoryModal({
  open,
  onClose,
  onSuccess,
  product,
}: Props) {
  const [form] = Form.useForm();
  const fromWarehouseId = useRequiredWarehouse();
  const { warehouses } = useWarehouses();
  const { transfer, loading } = useTransferInventory(() => {
    onSuccess();
    onClose();
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, product?.id]);

  async function handleOk() {
    const values = await form.validateFields();
    if (!product || !fromWarehouseId) return;

    await transfer({
      productId: product.id,
      fromWarehouseId,
      toWarehouseId: values.toWarehouseId,
      quantity: values.quantity,
    });
  }

  const destinationOptions = (warehouses ?? [])
    .filter((w) => w.id !== fromWarehouseId)
    .map((w) => ({ label: w.name, value: w.id }));

  return (
    <Modal
      title={`Transferir inventario — ${product?.name ?? ""}`}
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
          message={`Stock disponible en bodega actual: ${product.stock} unidades`}
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
          name="quantity"
          label="Cantidad a transferir"
          rules={[
            { required: true, message: "Ingrese la cantidad" },
            {
              type: "number",
              min: 1,
              message: "La cantidad debe ser mayor a 0",
            },
            {
              validator: (_, value) => {
                if (value && product && value > product.stock) {
                  return Promise.reject(
                    new Error(
                      `No puede transferir más de ${product.stock} unidades`
                    )
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
            placeholder="Ej. 10"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}