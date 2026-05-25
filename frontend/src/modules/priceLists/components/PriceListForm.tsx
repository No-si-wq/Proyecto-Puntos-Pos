import { Form, Input, Switch } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { PriceList, CreatePriceListDto, UpdatePriceListDto } from "../types/pricelist";

interface Props {
  isEdit: boolean,
  onSubmit: (data: CreatePriceListDto | UpdatePriceListDto) => Promise<void>;
  onCancel: () => void;
  initial?: PriceList | null;
  loading?: boolean;
}

export function PriceListForm({ isEdit, onSubmit, onCancel, initial, loading }: Props) {
  const initialValues = initial
    ? { name: initial.name, description: initial.description ?? "", active: initial.active }
    : { name: "", description: "", active: true };

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      submitText={initial ? "Actualizar" : "Crear"}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, message: "El nombre es obligatorio" }]}
      >
        <Input placeholder="Ej. Lista Mayoreo" />
      </Form.Item>

      <Form.Item name="description" label="Descripción">
        <Input.TextArea rows={2} placeholder="Descripción opcional" />
      </Form.Item>

      {isEdit && (
        <Form.Item name="active" label="Activa" valuePropName="checked">
          <Switch />
        </Form.Item>
      )}
    </FormBase>
  );
}