import { Form, Input, Switch } from "antd";
import type { Supplier } from "../supplier";
import FormBase from "../../../core/components/forms/FormBase";

interface SupplierFormProps {
  isEdit: boolean;
  initialValues?: Partial<Supplier>;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
}: SupplierFormProps) {
  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, min: 3 }]}
      >
        <Input autoFocus />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: "email", message: "Email inválido" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="phone" label="Teléfono">
        <Input />
      </Form.Item>

      {isEdit && (
        <Form.Item
          name="active"
          label="Activo"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      )}
    </FormBase>
  );
}