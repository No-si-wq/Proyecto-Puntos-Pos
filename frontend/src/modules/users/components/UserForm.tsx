import { Form, Input, Select, Switch } from "antd";
import { Role } from "../../../core/auth/roles";
import type { User } from "../user";
import { useWarehouses } from "../../warehouses/hooks/useWarehouse";
import FormBase from "../../../core/components/forms/FormBase";

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

  const { warehouses } = useWarehouses();

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
        name="username"
        label="Nombre de usuario"
        rules={[{ required: true, min: 3 }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="warehouseId"
        label="Almacen"
      >
        <Select 
          showSearch
          placeholder="Seleccione almacen"
          optionFilterProp="label"
          options={warehouses.map((w) => ({
            value: w.id,
            label: w.name,
          }))}
        />
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
          <Select.Option value={Role.SELLER}>
            VENDEDOR
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