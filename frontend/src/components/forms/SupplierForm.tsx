import { Form, Input, Switch } from "antd";
import type { Supplier } from "../../types/supplier";
import FormBase from "./FormBase";

export interface SupplierFormValues {
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

interface Props {
  isEdit: boolean;
  initialValues?: Partial<Supplier>;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  onCancel: () => void;
}

export default function SupplierForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
}: Props) {
  const formInitialValues: Partial<SupplierFormValues> | undefined =
  initialValues && {
      ...initialValues,
      email: initialValues.email ?? undefined,
      phone: initialValues.phone ?? undefined,
  };
  return (
    <FormBase<SupplierFormValues>
      initialValues={formInitialValues}
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