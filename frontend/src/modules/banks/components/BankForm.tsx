import { Form, Input, Select } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { Bank, CreateBankInput, UpdateBankInput } from "../types/bank";

interface Props {
  initialValues?: Bank;
  onSubmit: (values: CreateBankInput | UpdateBankInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function BankForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const formInitialValues: Partial<UpdateBankInput> | undefined = initialValues
    ? {
        name: initialValues.name,
        bankName: initialValues.bankName ?? undefined,
        accountNumber: initialValues.accountNumber ?? undefined,
        accountType: initialValues.accountType ?? undefined,
        currency: initialValues.currency,
        active: initialValues.active,
      }
    : undefined;

  return (
    <FormBase
      initialValues={formInitialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      submitText={initialValues ? "Guardar cambios" : "Crear cuenta"}
    >
      <Form.Item
        name="name"
        label="Nombre de la cuenta"
        rules={[{ required: true, message: "El nombre es requerido" }]}
      >
        <Input placeholder="Ej. Cuenta Corriente BAC" />
      </Form.Item>

      <Form.Item name="bankName" label="Banco">
        <Input placeholder="Ej. BAC Credomatic" />
      </Form.Item>

      <Form.Item name="accountNumber" label="Número de cuenta">
        <Input placeholder="Ej. 123456789" />
      </Form.Item>

      <Form.Item name="accountType" label="Tipo de cuenta">
        <Select
          allowClear
          placeholder="Selecciona un tipo"
          options={[
            { label: "Cuenta Corriente", value: "CHECKING" },
            { label: "Cuenta de Ahorro", value: "SAVINGS" },
          ]}
        />
      </Form.Item>

      <Form.Item name="currency" label="Moneda" initialValue="HNL">
        <Select
          options={[
            { label: "Lempiras (HNL)", value: "HNL" },
            { label: "Dólares (USD)", value: "USD" },
          ]}
        />
      </Form.Item>
    </FormBase>
  );
}