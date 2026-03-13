import { Form, Input, Select } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { CommissionLevel, CreateCommissionLevelDto, UpdateCommissionLevelDto } from "../commission";
import { usePriceLists } from "../../priceLists/usePriceList";

interface Props {
  onSubmit: (data: CreateCommissionLevelDto | UpdateCommissionLevelDto) => Promise<void>;
  onCancel: () => void;
  initial?: CommissionLevel | null;
  loading?: boolean;
}

export function CommissionLevelForm({ onSubmit, onCancel, initial, loading }: Props) {
  const { priceLists = [] } = usePriceLists();

  const initialValues = initial
    ? {
        name: initial.name,
        description: initial.description ?? "",
        priceListId: initial.priceListId ?? null,
      }
    : { name: "", description: "", priceListId: null };

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

      <Form.Item
        name="priceListId"
        label="Lista de precios"
        tooltip="Si se asigna, este nivel aplica cuando se vende con esa lista. Si no, aplica al precio base."
      >
        <Select
          allowClear
          placeholder="Precio base (sin lista)"
          options={priceLists
            .filter((pl) => pl.active)
            .map((pl) => ({ value: pl.id, label: pl.name }))}
        />
      </Form.Item>

      <Form.Item name="description" label="Descripción">
        <Input.TextArea rows={2} placeholder="Descripción opcional" />
      </Form.Item>
    </FormBase>
  );
}