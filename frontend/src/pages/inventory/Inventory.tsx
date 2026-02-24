import {
  Tag,
  Row,
  Col,
  Button,
  Card,
  Spin,
} from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";

import SimpleTable from "../../components/tables/SimpleTable";
import { useInventory } from "../../hooks/useInventory";
import { useResponsiveSizes } from "../../hooks/useResponsiveSizes";
import { exportToPdf } from "../../utils/exportPDF";
import { exportToExcel } from "../../utils/exportExcel";

interface Lot {
  id: number;
  quantity: number;
  cost: number;
  expiresAt?: string | null;
  purchase: {
    id: number;
    createdAt: string;
  };
}

export default function InventoryPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const sizes = useResponsiveSizes();

  const id = productId ? Number(productId) : undefined;

  const {
    stock,
    lots,
    productName,
    loading,
  } = useInventory(id);

  if (!id) {
    return <Card>ID de producto inválido</Card>;
  }

  const exportRows = useMemo(() => {
    return lots.map((l) => ({
      N_Compra: `#${l.purchase.id}`,
      Cantidad: l.quantity,
      Costo: l.cost,
      Expira: l.expiresAt
        ? dayjs(l.expiresAt).format("DD/MM/YYYY")
        : "-",
      Creado_el: dayjs(l.purchase.createdAt).format(
        "DD/MM/YYYY HH:mm"
      ),
    }));
  }, [lots]);

  function handleExportExcel() {
    exportToExcel(exportRows, "Lote_Compras");
  }

  function handleExportPdf() {
    exportToPdf(
      "Lotes de Compra",
      [
        { header: "N° Compra", dataKey: "N_Compra" },
        { header: "Cantidad", dataKey: "Cantidad" },
        { header: "Costo", dataKey: "Costo" },
        { header: "Expira", dataKey: "Expira" },
        { header: "Creado el", dataKey: "Creado_el" },
      ],
      exportRows,
      "Lote_Compras"
    );
  }

  const columns: ColumnsType<Lot> = useMemo(
    () => [
      {
        title: "Compra",
        render: (_, r) => `#${r.purchase.id}`,
      },
      {
        title: "Cantidad",
        dataIndex: "quantity",
      },
      {
        title: "Costo",
        dataIndex: "cost",
      },
      {
        title: "Creado el",
        render: (_, r) =>
          dayjs(r.purchase.createdAt).format(
            "DD/MM/YYYY HH:mm"
          ),
      },
      {
        title: "Expira",
        render: (_, r) =>
          r.expiresAt
            ? dayjs(r.expiresAt).format("DD/MM/YYYY")
            : "—",
      },
      {
        title: "Estado",
        render: (_, r) => {
          if (!r.expiresAt) return <Tag>N/A</Tag>;

          const days = dayjs(r.expiresAt).diff(
            dayjs(),
            "day"
          );

          if (days < 0)
            return <Tag color="red">Vencido</Tag>;

          if (days <= 60)
            return <Tag color="orange">
              Por vencer
            </Tag>;

          return <Tag color="green">OK</Tag>;
        },
      },
    ],
    []
  );

  return (
    <Card
      title={`Inventario - ${productName ?? ""}`}
      extra={
        <Button
          size={sizes.button}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      }
      style={{ padding: sizes.cardPadding }}
    >
      <Spin spinning={loading}>
        <p>
          Stock actual: <strong>{stock}</strong>
        </p>

        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Row gutter={12}>
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
          data={lots}
          columns={columns}
          loading={loading}
        />
      </Spin>
    </Card>
  );
}