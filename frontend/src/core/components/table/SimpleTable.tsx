import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { useDeviceType } from "../../hooks/useDeviceType";

interface Props<T extends { id: number }> {
  columns: ColumnsType<T>;
  data: T[];
  loading?: boolean;
  mobileColumns?: ColumnsType<T>;
  mobileRowRender?: (record: T) => React.ReactNode;
}

export default function SimpleTable<T extends { id: number }>({
  columns,
  data,
  loading,
  mobileColumns,
  mobileRowRender,
}: Props<T>) {
  const sizes = useResponsiveSizes();
  const { isMobile, isTablet } = useDeviceType();
  const isCompact = isMobile || isTablet;

  if (isMobile && mobileRowRender) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 8,
                background: "#f5f5f5",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", color: "#bbb", padding: "32px 0" }}>
            Sin datos
          </div>
        ) : (
          data.map((record) => (
            <div key={record.id}>{mobileRowRender(record)}</div>
          ))
        )}
      </div>
    );
  }

  const activeColumns =
    isCompact && mobileColumns ? mobileColumns : columns;

  return (
    <Table
      rowKey="id"
      columns={activeColumns}
      dataSource={data}
      size={isCompact ? "small" : sizes.table}
      loading={loading}
      pagination={{ simple: isCompact }}
      scroll={isCompact && !mobileColumns ? { x: "max-content" } : undefined}
    />
  );
}