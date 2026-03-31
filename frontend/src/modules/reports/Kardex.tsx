import { useMemo, useState, useEffect, useRef } from "react";
import {
  Table,
  Card,
  Button,
  Select,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Drawer,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { FilterOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useReports } from "./useReport";
import { useWarehouseProducts } from "../warehouses/useWarehouseProducts";
import ResponsiveRangePicker from "../../core/components/common/ResponsiveRangePicker";
import { formatCurrency } from "../../core/utils/formatters";
import type { KardexRow, KardexTableRow } from "./report";
import { exportKardexToExcel } from "../../core/utils/exportExcel";
import { useResponsiveSizes } from "../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../core/hooks/useDeviceType";
import { useRequiredWarehouse } from "../warehouses/useRequiredWarehouse";

export default function Kardex() {
  const { products, loading: loadingProducts } = useWarehouseProducts();
  const sizes   = useResponsiveSizes();
  const { fetchKardex, loading } = useReports();
  const { isMobile } = useDeviceType();
  const warehouseId = useRequiredWarehouse();

  const [productId, setProductId]         = useState<number>();
  const [range, setRange]                 = useState<any>();
  const [data, setData]                   = useState<KardexRow[]>([]);
  const [initialBalance, setInitialBalance] = useState<any>(null);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [cursor, setCursor]               = useState<{ createdAt: string; id: string } | null>(null);
  const [filterOpen, setFilterOpen]       = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

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
      isInitial: true,
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
      if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loadingMore) {
        handleNext();
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
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
    if (!result.nextCursor) setHasMore(false);
    if (isMobile) setFilterOpen(false);
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
    setData((prev) => [...prev, ...result.movements]);
    setCursor(result.nextCursor ?? null);
    if (!result.nextCursor) setHasMore(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setInitialBalance(null);
  }, [productId, warehouseId]);

  function clearFilter() {
    setData([]);
    setRange(null);
    setCursor(null);
    setHasMore(true);
    setInitialBalance(null);
    setProductId(undefined);
  }

  const finalBalance = useMemo(() => {
    if (!data.length) return null;
    return data[data.length - 1];
  }, [data]);

  const desktopColumns: ColumnsType<KardexTableRow> = [
    {
      title: "Fecha",
      dataIndex: "date",
      width: 180,
      render: (value, r: any) =>
        r.isInitial
          ? dayjs(value).format("DD/MM/YYYY")
          : dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tipo",
      dataIndex: "type",
      width: 120,
      render: (value, r: any) => {
        if (r.isInitial) return <Tag color="blue">Inicial</Tag>;
        return value === "IN"
          ? <Tag color="green">Entrada</Tag>
          : <Tag color="red">Salida</Tag>;
      },
    },
    {
      title: "Referencia",
      dataIndex: "note",
      width: 220,
      render: (v, r: any) => (r.isInitial ? <b>Saldo Inicial</b> : v),
    },
    {
      title: "Entrada",
      align: "right",
      width: 120,
      render: (_, r: any) =>
        r.isInitial ? "—" : r.type === "IN" ? r.quantity : "—",
    },
    {
      title: "Salida",
      align: "right",
      width: 120,
      render: (_, r: any) =>
        r.isInitial ? "—" : r.type === "OUT" ? r.quantity : "—",
    },
    {
      title: "Saldo Cantidad",
      align: "right",
      width: 150,
      render: (_, r: any) => formatQty(r.balance_qty),
    },
    {
      title: "Saldo Valor",
      align: "right",
      width: 150,
      render: (_, r: any) => formatMoney(r.balance_value),
    },
  ];

  const mobileColumns: ColumnsType<KardexTableRow> = [
    {
      title: "Movimiento",
      render: (_, r: any) => (
        <div>
          {r.isInitial ? (
            <Tag color="blue" style={{ marginBottom: 2 }}>Inicial</Tag>
          ) : r.type === "IN" ? (
            <Tag color="green" style={{ marginBottom: 2 }}>Entrada</Tag>
          ) : (
            <Tag color="red" style={{ marginBottom: 2 }}>Salida</Tag>
          )}
          <div style={{ fontSize: 11, color: "#888" }}>
            {r.isInitial
              ? dayjs(r.createdAt).format("DD/MM/YYYY")
              : dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            {r.isInitial ? <b>Saldo Inicial</b> : (r.note ?? "—")}
          </div>
          {!r.isInitial && (
            <div style={{ fontSize: 12, color: r.type === "IN" ? "#52c41a" : "#ff4d4f", marginTop: 2 }}>
              {r.type === "IN" ? "+" : "−"}{formatQty(r.quantity)} unid.
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Saldo",
      align: "right",
      render: (_, r: any) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{formatQty(r.balance_qty)} u.</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {formatMoney(r.balance_value)}
          </div>
        </div>
      ),
    },
  ];

  const filterPanel = (
    <Space direction="vertical" style={{ width: "100%" }} size="middle">
      <Select
        allowClear
        showSearch
        placeholder="Seleccionar producto"
        size={sizes.select}
        loading={loadingProducts}
        style={{ width: "100%" }}
        value={productId}
        onChange={(value) => setProductId(value)}
        options={products.map((p) => ({ label: p.name, value: p.id }))}
        optionFilterProp="label"
      />
      <ResponsiveRangePicker
        value={range}
        onChange={(dates) => setRange(dates)}
        size={sizes.input}
      />
      <Button
        type="primary"
        size={sizes.button}
        block
        onClick={handleSearch}
        disabled={!productId || !range}
      >
        Consultar
      </Button>
      <Button
        type="primary"
        size={sizes.button}
        block
        onClick={clearFilter}
        disabled={!productId || !range}
      >
        Limpiar
      </Button>
      {!isMobile && (
        <Button
          disabled={!data.length}
          size={sizes.button}
          block
          icon={<FileExcelOutlined />}
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
      )}
    </Space>
  );

  const balanceStats = (
    balance: any,
    title: "Saldo Inicial" | "Saldo Final"
  ) =>
    balance ? (
      <Card
        size="small"
        style={{ marginBottom: 12 }}
      >
        <Row gutter={isMobile ? 12 : 16}>
          <Col xs={12} sm={12}>
            <Statistic
              title={`${title} Cantidad`}
              value={balance.balance_qty ?? balance.quantity}
              valueStyle={{ fontSize: isMobile ? 16 : undefined }}
            />
          </Col>
          <Col xs={12} sm={12}>
            <Statistic
              title={`${title} Valor`}
              value={
                balance.balance_value
                  ? formatMoney(balance.balance_value)
                  : formatCurrency(balance.value)
              }
              valueStyle={{ fontSize: isMobile ? 16 : undefined }}
            />
          </Col>
        </Row>
      </Card>
    ) : null;

  return (
    <Card
      title="Kardex"
      bordered={false}
      extra={
        isMobile ? (
          <Space size={6}>
            <Button
              icon={<FilterOutlined />}
              size="small"
              type={productId ? "primary" : "default"}
              onClick={() => setFilterOpen(true)}
            >
              Filtrar
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              size="small"
              disabled={!data.length}
              onClick={() =>
                exportKardexToExcel(
                  data,
                  initialBalance,
                  selectedProduct?.name || "Producto",
                  dayjs(range?.[0]).format("YYYYMMDD"),
                  dayjs(range?.[1]).format("YYYYMMDD")
                )
              }
            />
          </Space>
        ) : undefined
      }
    >
      {!isMobile && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="horizontal" style={{ width: "100%", flexWrap: "wrap" }}>
            <div style={{ width: 280 }}>
              <Select
                allowClear
                showSearch
                placeholder="Seleccionar producto"
                size={sizes.select}
                loading={loadingProducts}
                style={{ width: "100%" }}
                value={productId}
                onChange={(value) => setProductId(value)}
                options={products.map((p) => ({ label: p.name, value: p.id }))}
                optionFilterProp="label"
              />
            </div>
            <ResponsiveRangePicker
              value={range}
              onChange={(dates) => setRange(dates)}
              size={sizes.input}
            />
            <Button
              type="primary"
              size={sizes.button}
              onClick={handleSearch}
              disabled={!productId || !range}
            >
              Consultar
            </Button>
            <Button
              size={sizes.button}
              onClick={clearFilter}
            >
              Limpiar
            </Button>
            <Button
              disabled={!data.length}
              size={sizes.button}
              icon={<FileExcelOutlined />}
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
      )}

      <Drawer
        open={filterOpen}
        title="Consultar Kardex"
        placement="bottom"
        height="auto"
        onClose={() => setFilterOpen(false)}
        styles={{ body: { paddingBottom: "max(24px, env(safe-area-inset-bottom))" } }}
      >
        {filterPanel}
      </Drawer>

      {balanceStats(initialBalance, "Saldo Inicial")}
      {balanceStats(finalBalance, "Saldo Final")}

      <div ref={tableRef}>
        <Table<KardexTableRow>
          rowKey="id"
          loading={loading}
          dataSource={dataWithInitial}
          size={isMobile ? "small" : sizes.table}
          pagination={false}
          columns={isMobile ? mobileColumns : desktopColumns}
          scroll={
            isMobile
              ? undefined               
              : { x: 900, y: 500 }      
          }
          locale={{ emptyText: "Selecciona un producto y rango de fechas" }}
          footer={
            loadingMore
              ? () => (
                  <div style={{ textAlign: "center", color: "#888", padding: "8px 0" }}>
                    Cargando más...
                  </div>
                )
              : !hasMore && data.length > 0
              ? () => (
                  <div style={{ textAlign: "center", color: "#bbb", fontSize: 12, padding: "6px 0" }}>
                    Fin de los registros
                  </div>
                )
              : undefined
          }
        />
      </div>
    </Card>
  );
}