import { Card, Select, Typography, Space, message } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import PageHeader from "../../../core/components/common/PageHeader";
import { PRICE_MODE_OPTIONS, type PriceMode } from "../types/settings";
import { useSettings } from "../hooks/useSettings";

const { Text } = Typography;

export default function Settings() {
  const { priceMode, loading, saving, savePriceMode } = useSettings();

  async function handlePriceModeChange(value: PriceMode) {
    try {
      await savePriceMode(value);
      message.success("Configuración guardada");
    } catch {
      message.error("Error al guardar la configuración");
    }
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Ajustes generales del sistema"
      />

      <Card
        title={
          <Space>
            <SettingOutlined />
            Ventas
          </Space>
        }
        style={{ maxWidth: 480 }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>Modo de precio</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Define si los precios de los productos incluyen o no el impuesto
            </Text>
          </div>
          <Select<PriceMode>
            style={{ width: "100%" }}
            value={priceMode}
            loading={loading || saving}
            disabled={loading || saving}
            options={PRICE_MODE_OPTIONS}
            onChange={handlePriceModeChange}
          />
        </Space>
      </Card>
    </>
  );
}