import { Form, Select, InputNumber } from "antd";
import { type User, Role } from "../../users/user";
import FormBase from "../../../core/components/forms/FormBase";
import type { SalesCommission, CommissionLevel, AssignCommissionDto, UpdateCommissionDto } from "../commission";

interface Props {
  onSubmit: (data: AssignCommissionDto | UpdateCommissionDto) => Promise<void>;
  onCancel: () => void;
  levels: CommissionLevel[];
  users: User[];
  initial?: SalesCommission | null;
  loading?: boolean;
}

export function AssignCommissionForm({ onSubmit, onCancel, levels, users, initial, loading }: Props) {
  const isEdit = !!initial;

  const initialValues = initial
    ? { userId: initial.userId, levelId: initial.levelId, percent: Number(initial.percent) }
    : { userId: undefined, levelId: undefined, percent: undefined };

  const handleSubmit = async (values: any) => {
    if (isEdit) {
      await onSubmit({ percent: values.percent } as UpdateCommissionDto);
    } else {
      await onSubmit(values as AssignCommissionDto);
    }
  };

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      loading={loading}
      submitText={isEdit ? "Actualizar" : "Asignar"}
    >
      <Form.Item
        name="userId"
        label="Vendedor"
        rules={[{ required: true, message: "Selecciona un vendedor" }]}
      >
        <Select
          showSearch
          disabled={isEdit}
          placeholder="Seleccionar usuario..."
          optionFilterProp="label"
          options={users
            .filter((u) => u.role === Role.USER)
            .map((u) => ({
              value: u.id,
              label: u.name ? `${u.name} (${u.username})` : u.username,
            }))}
        />
      </Form.Item>

      <Form.Item
        name="levelId"
        label="Nivel de comisión"
        rules={[{ required: true, message: "Selecciona un nivel" }]}
      >
        <Select
          disabled={isEdit}
          placeholder="Seleccionar nivel..."
          options={levels.map((l) => ({ value: l.id, label: l.name }))}
        />
      </Form.Item>

      <Form.Item
        name="percent"
        label="Porcentaje (%)"
        rules={[
          { required: true, message: "El porcentaje es obligatorio" },
          { type: "number", min: 0, max: 100, message: "Debe estar entre 0 y 100" },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          max={100}
          precision={2}
          addonAfter="%"
          placeholder="0.00"
        />
      </Form.Item>
    </FormBase>
  );
}