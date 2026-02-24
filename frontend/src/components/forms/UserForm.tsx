import { Form, Input, Select, Switch } from "antd";
import { Role } from "../../auth/roles";
import type { User } from "../../types/user";
import FormBase from "./FormBase";

interface UserFormProps {
  isEdit: boolean;
  initialValues?: Partial<User>;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

export default function UserForm({ 
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
}: UserFormProps) {

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, min: 3 }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: "email" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="username"
        label="Nombre de usuario"
        rules={[{ required: true, min: 3 }]}
      >
        <Input />
      </Form.Item>

      {!isEdit && (
        <Form.Item
          name="password"
          label="Contraseña"
          rules={[{ required: true, min: 6 }]}
        >
          <Input.Password />
        </Form.Item>
      )}

      <Form.Item
        name="role"
        label="Rol"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value={Role.ADMIN}>
            ADMIN
          </Select.Option>
          <Select.Option value={Role.USER}>
            USER
          </Select.Option>
        </Select>
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