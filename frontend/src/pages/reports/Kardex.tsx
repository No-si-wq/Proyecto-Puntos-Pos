import { useMemo, useState } from "react";
import { Table, Card, Button, Select, Row, Col, Statistic, Tag, Space } from "antd";
import dayjs from "dayjs";
import { useReports } from "../../hooks/useReport";
import { useWarehouseProducts } from "../../hooks/useWarehouseProducts";
import ResponsiveRangePicker from "../../components/common/ResponsiveRangePicker";
import { formatCurrency } from "../../utils/formatters";
import type { KardexRow } from "../../types/report";
import { exportKardexToExcel } from "../../utils/exportExcel";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useDeviceType } from "../../hooks/useDeviceType";

export default function Kardex() {
  const { products, loading: loadingProducts } = useWarehouseProducts();
  const sizes = useResponsiveSizes();
  const { fetchKardex, loading } = useReports();
  const { isMobile } = useDeviceType()
  const [initialBalance, setInitialBalance] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [productId, setProductId] = useState<number>();
  const [range, setRange] = useState<any>();
  const [data, setData] = useState<KardexRow[]>([]);

  const selectedProduct = products.find(p => p.id === productId);

  const handleSearch = async () => {
    if (!productId || !range) return;

    const result = await fetchKardex({
      productId,
      from: range[0].toISOString(),
      to: range[1].toISOString(),
      page: pagination.current,
      pageSize:pagination.pageSize,
    });

    setInitialBalance(result.initialBalance);
    setData(result.movements);
    setPagination(prev => ({
      ...prev,
      total: result.total
    }))
  };

  const finalBalance = useMemo(() => {
    if (!data.length) return null;
    return data[data.length - 1];
  }, [data]);

  return (
    <Card title="Kardex" bordered={false}>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ marginBottom: 12, width: isMobile ? "100%" : undefined }}
        >
          <Select
            allowClear
            showSearch
            placeholder="Seleccionar producto"
            size={sizes.select}
            loading={loadingProducts}
            style={{ width: "100%" }}
            value={productId}
            onChange={(value) => setProductId(value)}
            options={products.map((p) => ({
              label: `${p.name}`,
              value: p.id,
            }))}
            optionFilterProp="label"
          />

          <ResponsiveRangePicker
            style={{ width: "100%" }}
            onChange={(dates) => setRange(dates)}
            size={sizes.input}
          />

          <Button 
            type="primary" 
            size={sizes.button}
            block={isMobile}
            onClick={handleSearch}
          >
            Consultar
          </Button>

          <Button
            disabled={!data.length}
            size={sizes.button}
            block={isMobile}
            onClick={() =>
              exportKardexToExcel(
                data,
                selectedProduct?.name || "Producto",
                dayjs(range?.[0]).format("YYYYMMDD"),
                dayjs(range?.[1]).format("YYYYMMDD")
              )
            }
          >
            Exportar Excel
          </Button>
        </Space>
      </Card>

      {initialBalance && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col>
              <Statistic
                title="Saldo Inicial Cantidad"
                value={initialBalance.quantity}
              />
            </Col>
            <Col>
              <Statistic
                title="Saldo Inicial Valor"
                value={formatCurrency(initialBalance.value)}
              />
            </Col>
          </Row>
        </Card>
      )}

      {finalBalance && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col>
              <Statistic
                title="Saldo Final Cantidad"
                value={finalBalance.balance_qty}
              />
            </Col>
            <Col>
              <Statistic
                title="Saldo Final Valor"
                value={formatCurrency(finalBalance.balance_value)}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Table
        rowKey={(r) => r.reference + r.date}
        loading={loading}
        dataSource={data}
        size={sizes.table}
        pagination={{ 
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => {
            setPagination({  ...pagination, current: page, pageSize});
            handleSearch();
          }
         }}
        scroll={{ x: 900 }}
        columns={[
          {
            title: "Fecha",
            dataIndex: "date",
            render: (value) =>
              dayjs(value).format("DD/MM/YYYY HH:mm"),
          },
          {
            title: "Tipo",
            dataIndex: "type",
            render: (value) =>
              value === "IN" ? (
                <Tag color="green">Entrada</Tag>
              ) : (
                <Tag color="red">Salida</Tag>
              ),
          },
          {
            title: "Referencia",
            dataIndex: "reference",
          },
          {
            title: "Entrada",
            align: "right",
            render: (_, r) =>
              r.type === "IN" ? r.quantity : "-",
          },
          {
            title: "Salida",
            align: "right",
            render: (_, r) =>
              r.type === "OUT" ? r.quantity : "-",
          },
          {
            title: "Saldo Cantidad",
            dataIndex: "balance_qty",
            align: "right",
          },
          {
            title: "Saldo Valor",
            align: "right",
            render: (_, r) =>
              formatCurrency(r.balance_value),
          },
        ]}
      />
    </Card>
  );
}