import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";

interface Props<T extends { id: number }> {
  columns: ColumnsType<T>;
  data: T[];
  loading?: boolean;
}

export default function SimpleTable<T extends { id: number }>({
  columns,
  data,
  loading,
}: Props<T>) {
  const sizes = useResponsiveSizes();
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      size={sizes.table}
      loading={loading}
      scroll={{ x: "max-content" }}
    />
  );
}