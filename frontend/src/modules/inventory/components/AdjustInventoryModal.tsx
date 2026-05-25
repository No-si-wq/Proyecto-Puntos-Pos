import { Modal, Form, InputNumber, Input, Descriptions, Tag } from "antd";
import type { InventoryRow, AdjustPayload } from "../types/inventory";

interface Props {
  open: boolean;
  product: InventoryRow | null;
  onClose: () => void;
  onConfirm: (payload: AdjustPayload) => Promise<void>;
  loading?: boolean;
}

export default function AdjustInventoryModal({ open, product, onClose, onConfirm, loading }: Props) {
  const [form] = Form.useForm();

  async function handleOk() {
    const values = await form.validateFields();
    await onConfirm({
      productId: product!.id,
      physicalQuantity: values.physicalQuantity,
      note: values.note,
    });
    form.resetFields();
  }

  function handleCancel() {
    form.resetFields();
    onClose();
  }

  const delta = Form.useWatch("physicalQuantity", form);
  const diff = product != null && delta != null ? delta - product.stock : null;

  return (
    <Modal
      title="Ajuste de inventario"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Confirmar ajuste"
      cancelText="Cancelar"
      confirmLoading={loading}
      destroyOnClose
    >
      {product && (
        <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Producto">{product.name}</Descriptions.Item>
          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
          <Descriptions.Item label="Stock actual">
            <Tag color={product.stock <= 0 ? "red" : product.stock <= 5 ? "orange" : "green"}>
              {product.stock}
            </Tag>
          </Descriptions.Item>
          {diff !== null && (
            <Descriptions.Item label="Diferencia">
              <Tag color={diff === 0 ? "default" : diff > 0 ? "blue" : "red"}>
                {diff > 0 ? `+${diff}` : diff}
              </Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="physicalQuantity"
          label="Cantidad física contada"
          rules={[{ required: true, message: "Ingrese la cantidad contada" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Cantidad real en físico" />
        </Form.Item>
        <Form.Item
          name="note"
          label="Motivo del ajuste"
          rules={[{ required: true, message: "El motivo es requerido" }]}
        >
          <Input.TextArea rows={3} placeholder="Ej: Conteo físico mensual, merma, daño..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}