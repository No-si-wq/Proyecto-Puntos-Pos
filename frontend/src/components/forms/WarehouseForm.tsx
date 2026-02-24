import { Form, Input, Switch } from "antd";
import FormBase from "./FormBase";
import type { WarehouseFormValues } from "../../types/warehouse";

interface Props {
  initialValues?: WarehouseFormValues;
  onSubmit: (values: WarehouseFormValues) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function WarehouseForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  return (
    <FormBase<WarehouseFormValues>
      initialValues={{
        active: true,
        ...initialValues,
      }}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[
          { required: true, message: "Ingrese nombre" },
          { min: 2, message: "Mínimo 2 caracteres" },
        ]}
      >
        <Input placeholder="Nombre del almacén" />
      </Form.Item>

      <Form.Item
        name="active"
        label="Activo"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </FormBase>
  );
}