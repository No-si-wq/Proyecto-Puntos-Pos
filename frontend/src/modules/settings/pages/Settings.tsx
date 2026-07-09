import {
  Card, Select, Typography, Space, message, Switch, InputNumber,
  Row, Col, Form, Input, DatePicker, Button, Tag, Tabs, Table,
} from "antd";
import { SettingOutlined, GiftOutlined, AuditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { FiscalFormValues, FiscalConfig } from "../types/settings";
import dayjs from "dayjs";
import PageHeader from "../../../core/components/common/PageHeader";
import { PRICE_MODE_OPTIONS, type PriceMode } from "../types/settings";
import { useSettings } from "../hooks/useSettings";
import { useUsers } from "../../users/useUsers";

const { Text } = Typography;

export default function Settings() {
  const {
    priceMode,
    loading,
    saving,
    savePriceMode,
    loadingLoyalty,
    loyaltyConfig,
    savingLoyalty,
    saveLoyaltyConfig,
    fiscalConfigs,
    savingFiscal,
    saveFiscalConfig,
  } = useSettings();

  const { users } = useUsers();

  const [fiscalForm] = Form.useForm<FiscalFormValues & { userId?: number }>();

  async function handlePriceModeChange(value: PriceMode) {
    try {
      await savePriceMode(value);
      message.success("Configuración guardada");
    } catch {
      message.error("Error al guardar la configuración");
    }
  }

  const fiscalConfigColumns: ColumnsType<FiscalConfig> = [
    {
      title: "Asignado a",
      render: (_, r) => r.user ? (r.user.name ?? r.user.username) : <Tag color="blue">General</Tag>,
    },
    { title: "CAI", render: (_, r) => <Tag>{r.cai.slice(0, 8)}…</Tag> },
    { title: "Rango", render: (_, r) => `${r.rangeStart} – ${r.rangeEnd}` },
    {
      title: "Vence",
      render: (_, r) => (
        <Tag color={dayjs(r.expiresAt).isAfter(dayjs()) ? "green" : "red"}>
          {dayjs(r.expiresAt).format("DD/MM/YYYY")}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Ajustes generales del sistema"
      />

      <Tabs
        items={[
          {
            key: "sales",
            label: (
              <Space>
                <SettingOutlined />
                Ventas
              </Space>
            ),
            children: (
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text strong>Modo de precio</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Define si los precios de los productos incluyen o no el impuesto
                    </Text>
                  </div>
                  <Select<PriceMode>
                    style={{ width: "100%", maxWidth: 400 }}
                    value={priceMode}
                    loading={loading || saving}
                    disabled={loading || saving}
                    options={PRICE_MODE_OPTIONS}
                    onChange={handlePriceModeChange}
                  />
                </Space>
              </Card>
            ),
          },
          {
            key: "loyalty",
            label: (
              <Space>
                <GiftOutlined />
                Lealtad
              </Space>
            ),
            children: (
              <Card>
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <Space>
                    <Switch
                      checked={loyaltyConfig.earn.enabled}
                      loading={loadingLoyalty || savingLoyalty}
                      onChange={(val) =>
                        saveLoyaltyConfig({
                          ...loyaltyConfig,
                          earn: { ...loyaltyConfig.earn, enabled: val },
                        }).catch(() => message.error("Error al guardar"))
                      }
                    />
                    <Text strong>Acumulación de puntos activa</Text>
                  </Space>

                  <div>
                    <Text strong>Monto por punto</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cada cuántos lempiras se gana 1 punto
                    </Text>
                    <InputNumber
                      style={{ display: "block", marginTop: 4, maxWidth: 200 }}
                      min={1}
                      value={loyaltyConfig.earn.amountPerPoint}
                      disabled={loadingLoyalty || savingLoyalty || !loyaltyConfig.earn.enabled}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0)
                          saveLoyaltyConfig({
                            ...loyaltyConfig,
                            earn: { ...loyaltyConfig.earn, amountPerPoint: val },
                          }).catch(() => message.error("Error al guardar"));
                      }}
                    />
                  </div>

                  <Space>
                    <Switch
                      checked={loyaltyConfig.redeem.enabled}
                      loading={loadingLoyalty || savingLoyalty}
                      onChange={(val) =>
                        saveLoyaltyConfig({
                          ...loyaltyConfig,
                          redeem: { ...loyaltyConfig.redeem, enabled: val },
                        }).catch(() => message.error("Error al guardar"))
                      }
                    />
                    <Text strong>Canje de puntos activo</Text>
                  </Space>

                  <div>
                    <Text strong>Valor por punto</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Cuánto vale 1 punto en lempiras
                    </Text>
                    <InputNumber
                      style={{ display: "block", marginTop: 4, maxWidth: 200 }}
                      min={0.001}
                      step={0.01}
                      value={loyaltyConfig.redeem.pointValue}
                      disabled={loadingLoyalty || savingLoyalty || !loyaltyConfig.redeem.enabled}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0)
                          saveLoyaltyConfig({
                            ...loyaltyConfig,
                            redeem: { ...loyaltyConfig.redeem, pointValue: val },
                          }).catch(() => message.error("Error al guardar"));
                      }}
                    />
                  </div>
                </Space>
              </Card>
            ),
          },
          {
            key: "fiscal",
            label: (
              <Space>
                <AuditOutlined />
                Fiscal
              </Space>
            ),
            children: (
              <Card>
            {fiscalConfigs.length > 0 && (
              <Table<FiscalConfig>
                rowKey="id"
                size="small"
                style={{ marginBottom: 16 }}
                pagination={false}
                dataSource={fiscalConfigs}
                columns={fiscalConfigColumns}
              />
            )}

                <Form
                  form={fiscalForm}
                  layout="vertical"
                  initialValues={{ documentType: "01", establishment: "001", emissionPoint: "001" }}
                  onFinish={async (values) => {
                    try {
                      await saveFiscalConfig({
                        ...values,
                        userId: values.userId || undefined,
                        expiresAt: values.expiresAt.toISOString(),
                      });
                      message.success("Configuración fiscal guardada");
                      fiscalForm.resetFields();
                    } catch {
                      message.error("Error al guardar la configuración fiscal");
                    }
                  }}
                  >
                    <Form.Item label="Asignar a" name="userId" tooltip="Deja vacío para un CAI general del negocio, o elige un usuario para darle su propio folio">
                      <Select
                        allowClear
                        placeholder="General (todo el negocio)"
                        options={users.filter(u => u.active).map(u => ({ label: `${u.name} (${u.username})`, value: u.id }))}
                      />
                    </Form.Item>

                    <Form.Item label="CAI" name="cai" rules={[{ required: true, message: "Requerido" }]}>
                    <Input
                      placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX"
                      style={{ fontFamily: "monospace" }}
                    />
                  </Form.Item>

                  <Row gutter={8}>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Establecimiento" name="establishment" rules={[{ required: true }]}>
                        <Input maxLength={3} placeholder="001" style={{ fontFamily: "monospace" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Punto emisión" name="emissionPoint" rules={[{ required: true }]}>
                        <Input maxLength={3} placeholder="001" style={{ fontFamily: "monospace" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Form.Item label="Tipo doc." name="documentType" rules={[{ required: true }]}>
                        <Input maxLength={2} placeholder="01" style={{ fontFamily: "monospace" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Rango inicial" name="rangeStart" rules={[{ required: true }]}>
                        <Input placeholder="001-001-01-00000001" style={{ fontFamily: "monospace" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="Rango final" name="rangeEnd" rules={[{ required: true }]}>
                        <Input placeholder="001-001-01-00099999" style={{ fontFamily: "monospace" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="Fecha límite de emisión"
                    name="expiresAt"
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      disabledDate={(d) => d.isBefore(dayjs())}
                    />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" loading={savingFiscal}>
                    Registrar CAI
                  </Button>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}