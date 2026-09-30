import { Form, Input } from "antd";
import FormBase from "../../../core/components/forms/FormBase";

interface ChangePasswordFormProps {
  onSubmit: (values: { password: string }) => Promise<void>;
  onCancel: () => void;
}

export default function ChangePasswordForm({ onSubmit, onCancel }: ChangePasswordFormProps) {
  return (
    <FormBase onSubmit={onSubmit} onCancel={onCancel}>
      <Form.Item
        name="password"
        label="Nueva contraseña"
        rules={[{ required: true, min: 6 }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Confirmar contraseña"
        dependencies={["password"]}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) return Promise.resolve();
              return Promise.reject(new Error("Las contraseñas no coinciden"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
    </FormBase>
  );
}