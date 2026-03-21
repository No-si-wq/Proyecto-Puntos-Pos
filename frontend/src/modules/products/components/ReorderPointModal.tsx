import { useEffect } from "react";
import { Modal, Form, InputNumber, Button, Space } from "antd";

interface Props {
  open: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  currentReorderPoint: number;
  onSave: (productId: number, reorderPoint: number) => Promise<void>;
}

export default function ReorderPointModal({
  open,
  onClose,
  productId,
  productName,
  currentReorderPoint,
  onSave,
}: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ reorderPoint: currentReorderPoint });
    }
  }, [open, currentReorderPoint, form]);

  async function handleSubmit() {
    const values = await form.validateFields();
    await onSave(productId, values.reorderPoint);
    onClose();
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Punto de reorden — ${productName}`}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reorderPoint"
          label="Cantidad mínima antes de alertar"
          rules={[
            { required: true, message: "Campo requerido" },
            { type: "number", min: 0, message: "Debe ser 0 o mayor" },
          ]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSubmit}>
              Guardar
            </Button>
            <Button onClick={onClose}>Cancelar</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}