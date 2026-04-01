import { Form, Input, Switch } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { Warehouse } from "../types/warehouse";

interface Props {
  isEdit: boolean;
  initialValues?: Partial<Warehouse>;
  onSubmit: (values: any) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function WarehouseForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  return (
    <FormBase
      initialValues={initialValues}
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