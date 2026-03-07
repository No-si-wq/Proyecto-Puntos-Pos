import { Form, Button, Space } from "antd";
import type { FormInstance } from "antd/es/form";
import type { ReactNode } from "react";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface FormBaseProps<T> {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  form?: FormInstance;
  children: ReactNode;
}

export default function FormBase<T>({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Guardar",
  cancelText = "Cancelar",
  form,
  children,
}: FormBaseProps<T>) {
  const [internalForm] = Form.useForm<T>();
  const usedForm = form ?? internalForm;
  const sizes = useResponsiveSizes();

  async function handleFinish(values: T) {
    await onSubmit(values);
    usedForm.resetFields();
  }

  return (
    <Form
      form={usedForm}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      {children}

      <Form.Item style={{ textAlign: "right" }}>
        <Space>
          {onCancel && (
            <Button onClick={onCancel} size={sizes.button}>
              {cancelText}
            </Button>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size={sizes.button}
          >
            {submitText}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}