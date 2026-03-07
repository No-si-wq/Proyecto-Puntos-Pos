import { useMemo, useState, useEffect, useRef } from "react";
import { Table, Card, Button, Select, Row, Col, Statistic, Tag, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useReports } from "./useReport";
import { useWarehouseProducts } from "../warehouses/useWarehouseProducts";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { formatCurrency } from "../../core/utils/formatters";
import type { KardexRow, KardexTableRow } from "./report";
import { exportKardexToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";

export default function Kardex() {
  const { products, loading: loadingProducts } = useWarehouseProducts();
  const sizes = useResponsiveSizes();
  const { fetchKardex, loading } = useReports();
  const { isMobile } = useDeviceType();

  const [productId, setProductId] = useState<number>();
  const [range, setRange] = useState<any>();
  const [data, setData] = useState<KardexRow[]>([]);
  const [initialBalance, setInitialBalance] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<{
    createdAt: string;
    id: string;
  } | null>(null)

  const selectedProduct = products.find(p => p.id === productId);

  const dataWithInitial = useMemo<KardexTableRow[]>(() => {

    if (!initialBalance) return data;

    const initialRow: KardexTableRow = {
      id: "initial-balance",

      createdAt: range?.[0]?.toISOString() ?? "",

      type: "IN", 

      quantity: Number(initialBalance.quantity),

      movementValue: "0",

      balance_qty: String(initialBalance.quantity),
      balance_value: String(initialBalance.value),

      isInitial: true
    };

    return [initialRow, ...data];

  }, [data, initialBalance, range]);

  const formatMoney = (value: string) =>
    new Intl.NumberFormat("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));

  const formatQty = (value: string | number) =>
    new Intl.NumberFormat("es-HN").format(Number(value));

  const tableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = tableRef.current?.querySelector(
      ".ant-table-body"
    ) as HTMLElement | null;

    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      if (scrollTop + clientHeight >= scrollHeight - 10) {
        if (hasMore && !loadingMore) {
          handleNext();
        }
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [cursor, hasMore, loadingMore]);

  const handleSearch = async () => {
    if (!productId || !range) return;

    setData([]);
    setCursor(null);
    setHasMore(true);

    const result = await fetchKardex({
      productId,
      from: range[0].toISOString(),
      to: range[1].toISOString(),
      pageSize: 20,
    });

    if (!result) return;

    setInitialBalance(result.baseBalance);

    setData(result.movements);

    setCursor(result.nextCursor ?? null);

    if (!result.nextCursor) {
      setHasMore(false);
    }
  };

  const handleNext = async () => {
    if (!productId || !range || !cursor || loadingMore || !hasMore) return;

    setLoadingMore(true);

    const result = await fetchKardex({
      productId,
      from: range[0].toISOString(),
      to: range[1].toISOString(),
      pageSize: 20,
      cursor,
    });

    if (!result) return;

    setData(prev => [...prev, ...result.movements]);

    setCursor(result.nextCursor ?? null);

    if (!result.nextCursor) {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setInitialBalance(null);
  }, [productId]);

  const finalBalance = useMemo(() => {
    if (!data.length) return null;
    return data[data.length - 1];
  }, [data]);

  const columns: ColumnsType<KardexTableRow> = [
    {
      title: "Fecha",
      dataIndex: "date",
      width: 180,
      render: (value, r: any) =>
        r.isInitial
          ? dayjs(value).format("DD/MM/YYYY")
          : dayjs(value).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "Tipo",
      dataIndex: "type",
      width: 120,
      render: (value, r: any) => {
        if (r.isInitial) {
          return <Tag color="blue">Inicial</Tag>;
        }

        return value === "IN"
          ? <Tag color="green">Entrada</Tag>
          : <Tag color="red">Salida</Tag>;
      }
    },
    {
      title: "Referencia",
      dataIndex: "note",
      width: 220,
      render: (v, r: any) =>
        r.isInitial ? <b>Saldo Inicial</b> : v
    },
    {
      title: "Entrada",
      align: "right",
      width: 120,
      render: (_, r: any) =>
        r.isInitial ? "-" : r.type === "IN" ? r.quantity : "-"
    },
    {
      title: "Salida",
      align: "right",
      width: 120,
      render: (_, r: any) =>
        r.isInitial ? "-" : r.type === "OUT" ? r.quantity : "-"
    },
    {
      title: "Saldo Cantidad",
      align: "right",
      width: 150,
      render: (_, r: any) => formatQty(r.balance_qty)
    },
    {
      title: "Saldo Valor",
      align: "right",
      width: 150,
      render: (_, r: any) => formatMoney(r.balance_value)
    },
  ];

  return (
    <Card title="Kardex" bordered={false}>
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ marginBottom: 12, width: isMobile ? "100%" : undefined }}
        >
          <div
            style={{
              width: isMobile ? "100%" : 280
            }}
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
          </div>

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
                initialBalance,
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
                value={formatMoney(finalBalance.balance_value)}
              />
            </Col>
          </Row>
        </Card>
      )}

      <div ref={tableRef}>
        <Table<KardexTableRow>
          rowKey="id"
          loading={loading}
          dataSource={dataWithInitial}
          size={sizes.table}
          pagination={false}
          scroll={{ x: 900, y: 500 }}
          columns={columns}
        />
      </div>
    </Card>
  );
}