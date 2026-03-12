import { Form, InputNumber, Select } from "antd";
import FormBase from "../../../core/components/forms/FormBase";
import type { ProductPrice, PriceList } from "../../priceLists/pricelist";

interface Props {
  productId: number;
  priceLists: PriceList[];
  onSubmit: (values: { priceListId: number; price: number }) => Promise<void>;
  onCancel: () => void;
  initial?: ProductPrice | null;
  existingPriceListIds: number[];
  loading?: boolean;
}

export default function ProductPriceForm({
  priceLists,
  onSubmit,
  onCancel,
  initial,
  existingPriceListIds,
  loading,
}: Props) {
  const isEdit = !!initial;
  const safePriceLists = Array.isArray(priceLists) ? priceLists : [];

  const availableLists = isEdit
    ? safePriceLists
    : safePriceLists.filter(
        (pl) => pl.active && !existingPriceListIds.includes(pl.id)
      );

  const initialValues = initial
    ? { priceListId: initial.priceListId, price: Number(initial.price) }
    : { priceListId: undefined, price: undefined };

  return (
    <FormBase
      initialValues={initialValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      submitText={isEdit ? "Actualizar" : "Agregar"}
    >
      <Form.Item
        name="priceListId"
        label="Lista de precios"
        rules={[{ required: true, message: "Selecciona una lista" }]}
      >
        <Select
          disabled={isEdit}
          placeholder="Seleccionar lista..."
          options={availableLists.map((pl) => ({
            value: pl.id,
            label: pl.name,
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
