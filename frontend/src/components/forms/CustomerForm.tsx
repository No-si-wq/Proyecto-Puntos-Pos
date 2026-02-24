import { Form, Input, Switch } from "antd";
import type { Customer } from "../../types/customer";
import FormBase from "./FormBase";

export interface CustomerFormValues {
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

interface CustomerFormProps {
  isEdit: boolean;
  initialValues?: Partial<Customer>;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  return (
    <FormBase<CustomerFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[
          { required: true, min: 3, message: "Nombre requerido (mín. 3)" },
        ]}
      >
        <Input autoFocus />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { type: "email", message: "Email inválido" },
        ]}
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