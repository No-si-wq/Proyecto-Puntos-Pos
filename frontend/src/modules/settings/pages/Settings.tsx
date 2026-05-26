import { Card, Select, Typography, Space, message, Switch, InputNumber, Row, Col } from "antd";
import { SettingOutlined, GiftOutlined } from "@ant-design/icons";
import PageHeader from "../../../core/components/common/PageHeader";
import { PRICE_MODE_OPTIONS, type PriceMode } from "../types/settings";
import { useSettings } from "../hooks/useSettings";

const { Text } = Typography;

export default function Settings() {
  const { priceMode, loading, saving, savePriceMode, loadingLoyalty, loyaltyConfig, savingLoyalty, saveLoyaltyConfig } = useSettings();

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

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} md={12}>
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
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <GiftOutlined />
                Puntos de lealtad
              </Space>
            }
            style={{ maxWidth: 480 }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Space>
                <Switch
                  checked={loyaltyConfig.earn.enabled}
                  loading={loadingLoyalty || savingLoyalty}
                  onChange={(val) =>
                    saveLoyaltyConfig({ ...loyaltyConfig, earn: { ...loyaltyConfig.earn, enabled: val } })
                      .catch(() => message.error("Error al guardar"))
                  }
                />
                <Text strong>Acumulación de puntos activa</Text>
              </Space>

              <div>
                <Text strong>Monto por punto</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Cada cuántos lempiras se gana 1 punto</Text>
                <InputNumber
                  style={{ display: "block", marginTop: 4 }}
                  min={1}
                  value={loyaltyConfig.earn.amountPerPoint}
                  disabled={loadingLoyalty || savingLoyalty || !loyaltyConfig.earn.enabled}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0)
                      saveLoyaltyConfig({ ...loyaltyConfig, earn: { ...loyaltyConfig.earn, amountPerPoint: val } })
                        .catch(() => message.error("Error al guardar"));
                  }}
                />
              </div>

              <Space>
                <Switch
                  checked={loyaltyConfig.redeem.enabled}
                  loading={loadingLoyalty || savingLoyalty}
                  onChange={(val) =>
                    saveLoyaltyConfig({ ...loyaltyConfig, redeem: { ...loyaltyConfig.redeem, enabled: val } })
                      .catch(() => message.error("Error al guardar"))
                  }
                />
                <Text strong>Canje de puntos activo</Text>
              </Space>

              <div>
                <Text strong>Valor por punto</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>Cuánto vale 1 punto en lempiras</Text>
                <InputNumber
                  style={{ display: "block", marginTop: 4 }}
                  min={0.001}
                  step={0.01}
                  value={loyaltyConfig.redeem.pointValue}
                  disabled={loadingLoyalty || savingLoyalty || !loyaltyConfig.redeem.enabled}
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0)
                      saveLoyaltyConfig({ ...loyaltyConfig, redeem: { ...loyaltyConfig.redeem, pointValue: val } })
                        .catch(() => message.error("Error al guardar"));
                  }}
                />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}