import { useEffect, useState } from "react";
import { Tag, Button, Input, Row, Col, Dropdown, Typography, Space, type MenuProps } from "antd";
import { MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

import { useInventoryList } from "../hooks/useInventoryList";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import type { InventoryRow } from "../types/inventory";
import { getAllowedRoles } from "../../../core/utils/permissions";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import TransferInventoryModal from "../components/Transferinventorymodal";
import TransferProductModal from "../components/TransferProductModal";

const { Text } = Typography;

function stockTag(value: number) {
  if (value <= 0)  return <Tag color="red">{value}</Tag>;
  if (value <= 5)  return <Tag color="orange">{value}</Tag>;
  return <Tag color="green">{value}</Tag>;
}

export default function InventoryList() {
  const { data, loading, setFilters, reload } = useInventoryList();

  const navigate = useNavigate();
  const sizes = useResponsiveSizes();
  const { isMobile } = useDeviceType();

  const [searchValue, setSearchValue] = useState("");
  const [exporting, setExporting]   = useState(false);
  const [transferProduct, setTransferProduct]         = useState<InventoryRow | null>(null);
  const [transferProductTarget, setTransferProductTarget] = useState<InventoryRow | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({
        search: searchValue || undefined,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  function buildExportRows(data: InventoryRow[]) {
    return data
      .filter(i => i.active)
      .map(i => ({
        Codigo: i.sku,
        Nombre: i.name,
        Existencias: i.stock,
      }));
  }

  function handleExportExcel() {
    setExporting(true)
    try {
      exportToExcel(
        buildExportRows(data),
        "Inventario"
      );
    } finally { setExporting(false) }
  }

  function handleExportPdf() {
    setExporting(true);
    try {
      exportToPdf(
        "Inventario",
        [
          { header: "Codigo", dataKey: "Codigo" },
          { header: "Nombre", dataKey: "Nombre" },
          { header: "Existencias", dataKey: "Existencias" },
        ],
        buildExportRows(data),
        "Inventario"
      );
    } finally { setExporting(false) }
  }

  function getRowMenu(record: InventoryRow): MenuProps {
    return {
      items: [
        {
          key: "detail",
          label: "Ver detalle",
          onClick: () => navigate(`/inventory/${record.id}`),
        },
        {
          key: "transfer",
          label: "Transferir",
          disabled: record.stock <= 0,
          onClick: () => setTransferProduct(record),
        },
        {
          key: "transfer-product",
          label: "Transferir a producto",
          disabled: record.stock <= 0,
          onClick: () => setTransferProductTarget(record),
        },
      ],
    };
  }

  const exportMenu: MenuProps = {
    items: [
      { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
      { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
    ],
  };

  const desktopColumns: ColumnsType<InventoryRow> = [
    { title: "Código",  dataIndex: "sku"  },
    { title: "Producto", dataIndex: "name" },
    {
      title: "Existencias", dataIndex: "stock",
      sorter: (a, b) => a.stock - b.stock,
      render: (value) => stockTag(value),
    },
    { title: "Activo", dataIndex: "active", render: (v) => (v ? "Sí" : "No") },
    {
      title: "Acciones",
      render: (_, record) => (
        <Row gutter={8} wrap={false}>
          <Col>
            <Button size={sizes.button} onClick={() => navigate(`/inventory/${record.id}`)}>Ver detalle</Button>
          </Col>
          <Col>
            <ProtectedButton roles={getAllowedRoles("inventory", "manage")} size={sizes.button}
              disabled={record.stock <= 0} onClick={() => setTransferProduct(record)}>
              Transferir
            </ProtectedButton>
          </Col>
          <Col>
            <ProtectedButton roles={getAllowedRoles("inventory", "manage")} size={sizes.button}
              disabled={record.stock <= 0} onClick={() => setTransferProductTarget(record)}>
              Transferir a producto
            </ProtectedButton>
          </Col>
        </Row>
      ),
    },
  ];

  const mobileColumns: ColumnsType<InventoryRow> = [
    {
      title: "Producto",
      render: (_, r) => (
        <div>
          <Text strong style={{ display: "block" }}>{r.name}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.sku}</Text>
        </div>
      ),
    },
    {
      title: "Stock",
      align: "right",
      render: (_, r) => (
        <div style={{ textAlign: "right" }}>
          {stockTag(r.stock)}
          <div style={{ marginTop: 6 }}>
            <Dropdown menu={getRowMenu(r)} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" style={{ border: "none", boxShadow: "none" }} />
            </Dropdown>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Consulte el estado de su inventario"
        extra={
          isMobile ? (
            <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" loading={exporting} />
            </Dropdown>
          ) : (
            <Space>
              <Button onClick={handleExportExcel} size={sizes.button} loading={exporting}>Exportar Excel</Button>
              <Button onClick={handleExportPdf}   size={sizes.button} loading={exporting}>Exportar PDF</Button>
            </Space>
          )
        }
      />

      <div style={{ marginBottom: 12 }}>
        <Input
          placeholder="Buscar por nombre"
          allowClear
          size={sizes.input}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      <SimpleTable
        columns={desktopColumns}
        mobileColumns={mobileColumns}
        data={data}
        loading={loading}
      />

      <TransferInventoryModal
        open={transferProduct !== null}
        product={transferProduct}
        onClose={() => setTransferProduct(null)}
        onSuccess={reload}
      />

      <TransferProductModal
        open={transferProductTarget !== null}
        product={transferProductTarget}
        onClose={() => setTransferProductTarget(null)}
        onSuccess={reload}
      />

    </>
  );
}