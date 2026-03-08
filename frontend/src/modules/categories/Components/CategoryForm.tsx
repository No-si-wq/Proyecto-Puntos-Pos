import { Form, Input, } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { CategoryFormProps } from "../category";

export default function CreateEditCategoryForm({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: CategoryFormProps) {

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
    >
      <Form.Item
        label="Nombre"
        name="name"
        rules={[{ required: true, message: "El nombre es requerido" }]}
      >
        <Input />
      </Form.Item>
    </FormBase>
  );
}