import { Form, Input, InputNumber, Switch, Button, Space } from "antd";
import type { ProductFormProps, ProductFormValues } from "../../types/product";
import FormBase from "./FormBase";
import { CategoryCascader } from "../categories/CategoryCascader";

export default function ProductForm({
  isEdit,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  return (
    <FormBase<ProductFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
    >
      <Form.Item
        name="sku"
        label="SKU"
        rules={[
          { required: true, message: "Codigo requerido" },
          { min: 3, message: "Codigo muy corto" },
        ]}
      >
        <Input autoFocus />
      </Form.Item>

      <Form.Item
        name="name"
        label="Nombre"
        rules={[
          { required: true, min: 3, message: "Nombre requerido (mín. 3)" },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="description" label="Descripción">
        <Input />
      </Form.Item>

      <Form.Item
        name="cost"
        label="Costo"
        rules={[
          { required: true, type: "number", min: 0, message: "Costo inválido" },
        ]}
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="price"
        label="Precio"
        rules={[
          { required: true, type: "number", min: 0, message: "Precio inválido" },
        ]}
      >
        <InputNumber min={0} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="categoryPath"
        label="Categoría"
        rules={[
          { required: true, message: "Categoría requerida" },
        ]}
      >
        <CategoryCascader />
      </Form.Item>

      <Form.List name="barcodes">
        {(fields, { add, remove }) => (
          <>
            <label>Códigos de barras</label>

            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
                <Form.Item
                  {...restField}
                  name={name}
                  rules={[
                    { required: true, message: "Código requerido" },
                    { min: 4, message: "Código inválido" },
                  ]}
                >
                  <Input placeholder="Escanear o escribir código" />
                </Form.Item>

                <Button
                  type="link"
                  danger
                  onClick={() => remove(name)}
                >
                  Quitar
                </Button>
              </Space>
            ))}

            <Form.Item>
              <Button type="dashed" onClick={() => add()}>
                + Agregar código
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

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