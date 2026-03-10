import { Form, Input } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { CommissionLevel, CreateCommissionLevelDto, UpdateCommissionLevelDto } from "../commission";

interface Props {
  onSubmit: (data: CreateCommissionLevelDto | UpdateCommissionLevelDto) => Promise<void>;
  onCancel: () => void;
  initial?: CommissionLevel | null;
  loading?: boolean;
}

export function CommissionLevelForm({ onSubmit, onCancel, initial, loading }: Props) {
  const initialValues = initial
    ? { name: initial.name, description: initial.description ?? "" }
    : { name: "", description: "" };

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
        <Input placeholder="Ej. Ventas Nivel A" />
      </Form.Item>

      <Form.Item name="description" label="Descripción">
        <Input.TextArea rows={2} placeholder="Descripción opcional" />
      </Form.Item>
    </FormBase>
  );
}