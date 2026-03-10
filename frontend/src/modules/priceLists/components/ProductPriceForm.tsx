import { Form, InputNumber, Select } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { ProductPrice, UpsertProductPriceDto } from "../pricelist";

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  price: number;
}

interface Props {
  onSubmit: (data: UpsertProductPriceDto) => Promise<void>;
  onCancel: () => void;
  products: ProductOption[];
  initial?: ProductPrice | null;
  loading?: boolean;
}

export function ProductPriceForm({ onSubmit, onCancel, products, initial, loading }: Props) {
  const initialValues = initial
    ? { productId: initial.productId, price: Number(initial.price) }
    : { productId: undefined, price: undefined };

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      submitText={initial ? "Actualizar" : "Agregar"}
    >
      <Form.Item
        name="productId"
        label="Producto"
        rules={[{ required: true, message: "Selecciona un producto" }]}
      >
        <Select
          showSearch
          disabled={!!initial}
          placeholder="Buscar producto..."
          optionFilterProp="label"
          options={products.map((p) => ({
            value: p.id,
            label: `${p.sku} — ${p.name}`,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="price"
        label="Precio"
        rules={[
          { required: true, message: "El precio es obligatorio" },
          { type: "number", min: 0.01, message: "El precio debe ser mayor a 0" },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          min={0.01}
          precision={2}
          prefix="L"
          placeholder="0.00"
        />
      </Form.Item>
    </FormBase>
  );
}