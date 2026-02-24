import { useEffect, useState } from "react";
import { Tag, Button, Input, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";

import { useInventoryList } from "../../hooks/useInventoryList";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";
import PageHeader from "../../components/common/PageHeader";
import SimpleTable from "../../components/tables/SimpleTable";

interface InventoryRow {
  id: number;
  sku: string;
  name: string;
  stock: number;
  active: boolean;
}

export default function InventoryList() {
  const { data, loading, setFilters } = useInventoryList();

  const navigate = useNavigate();
  const sizes = useResponsiveSizes();

  const [searchValue, setSearchValue] = useState("");

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
    exportToExcel(
      buildExportRows(data),
      "Inventario"
    );
  }

  function handleExportPdf() {
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
  }

  const columns: ColumnsType<InventoryRow> = [
    { title: "Código", dataIndex: "sku" },
    { title: "Producto", dataIndex: "name" },
    {
      title: "Existencias",
      dataIndex: "stock",
      sorter: (a, b) => a.stock - b.stock,
      render: (value) =>
        value <= 0 ? (
          <Tag color="red">{value}</Tag>
        ) : value < 5 ? (
          <Tag color="orange">{value}</Tag>
        ) : (
          <Tag color="green">{value}</Tag>
        ),
    },
    {
      title: "Activo",
      dataIndex: "active",
      render: (v) => (v ? "Sí" : "No"),
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <Button
          size={sizes.button}
          onClick={() => navigate(`/inventory/${record.id}`)}
        >
          Ver detalle
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader 
        title="Inventario"
        subtitle="Consulte el estado de su inventario"
      />

      <Row 
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
        gutter={[16, 16]}
      >
        <Input
          placeholder="Buscar por nombre"
          allowClear
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Col>
          <Row gutter={[16, sizes.gutter]}>
            <Col>
              <Button
                onClick={handleExportExcel}
                size={sizes.button}
              >
                Exportar Excel
              </Button>
            </Col>

            <Col>
              <Button
                onClick={handleExportPdf}
                size={sizes.button}
              >
                Exportar PDF
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <SimpleTable
        columns={columns}
        data={data}
        loading={loading}
      />
    </>
  );
}