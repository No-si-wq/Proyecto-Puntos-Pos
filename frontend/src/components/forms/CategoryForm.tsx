import { Form, Input, Switch } from "antd";
import FormBase from "./FormBase";
import type { CategoryFormValues, CategoryFormProps } from "../../types/category";

export default function CreateEditCategoryForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: CategoryFormProps) {
  const [form] = Form.useForm<CategoryFormValues>();

  return (
    <FormBase<CategoryFormValues>
      form={form}
      initialValues={{
        active: true,
        ...initialValues,
      }}
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

      {isEdit && (
        <Form.Item
          label="Activa"
          name="active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      )}
    </FormBase>
  );
}