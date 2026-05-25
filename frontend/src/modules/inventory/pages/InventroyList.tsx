import { useEffect, useMemo, useState } from "react";
import { Tag, Button, Input, Row, Col, Dropdown, Typography, Space, message } from "antd";
import { MoreOutlined, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";

import { useInventoryList } from "../hooks/useInventoryList";
import { useResponsiveSizes } from "../../../core/hooks/useResponsiveSizes";
import { useDeviceType } from "../../../core/hooks/useDeviceType";
import { exportToPdf } from "../../../core/utils/exportPDF";
import { exportToExcel } from "../../../core/utils/exportExcel";
import { usePermissions } from "../../../core/hooks/usePermissions";
import type { InventoryRow, Lot } from "../types/inventory";
import ProtectedButton from "../../../core/components/common/ProtectedButton";
import TransferInventoryModal from "../components/Transferinventorymodal";
import PageHeader from "../../../core/components/common/PageHeader";
import SimpleTable from "../../../core/components/table/SimpleTable";
import dayjs from "dayjs";
import { getAllowedRoles } from "../../../core/utils/permissions";
import type { AdjustPayload } from "../types/inventory";
import TransferProductModal from "../components/TransferProductModal";
import TransferWarehouseModal from "../components/TransferWarehouseModal";
import AdjustInventoryModal from "../components/AdjustInventoryModal";

const { Text } = Typography;

function stockTag(value: number) {
  if (value <= 0)  return <Tag color="red">{value}</Tag>;
  if (value <= 5)  return <Tag color="orange">{value}</Tag>;
  return <Tag color="green">{value}</Tag>;
}

export default function InventoryList() {
  const [exporting, setExporting]   = useState(false);
  const { data, loading, setFilters, fetchAllLots, reload } = useInventoryList();
  const navigate                    = useNavigate();
  const sizes                       = useResponsiveSizes();
  const { isMobile }                = useDeviceType();
  const { canAccess }               = usePermissions();

  const [searchValue, setSearchValue]                 = useState("");
  const [transferProduct, setTransferProduct]         = useState<InventoryRow | null>(null);
  const [transferProductTarget, setTransferProductTarget] = useState<InventoryRow | null>(null);
  const [transferWarehouse, setTransferWarehouse] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryRow | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const { adjustInventory } = useInventoryList();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({ search: searchValue || undefined });
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  function buildExportRows(products: InventoryRow[], lots: Record<number, Lot[]>) {
    const rows: object[] = [];
    products.filter((p) => p.active).forEach((product) => {
      const productLots = lots[product.id] ?? [];
      if (productLots.length === 0) {
        rows.push({ Codigo: product.sku, Nombre: product.name, Existencias: product.stock,
          N_Lote: "-", Cantidad_Lote: "-", Costo: "-", Expira: "-", Creado_el: "-" });
      } else {
        productLots.forEach((lot) => {
          rows.push({ Codigo: product.sku, Nombre: product.name, Existencias: product.stock,
            N_Lote: `#${lot.lotNumber ?? "-"}`, Cantidad_Lote: lot.quantity, Costo: lot.cost,
            Expira: lot.expiresAt ? dayjs(lot.expiresAt).format("DD/MM/YYYY") : "-",
            Creado_el: dayjs(lot.purchase.createdAt).format("DD/MM/YYYY HH:mm"),
          });
        });
      }
    });
    return rows;
  }

  async function handleAdjust(payload: AdjustPayload) {
    setAdjustLoading(true);
    try {
      const result = await adjustInventory(payload);
      if (result.delta === 0) {
        message.info("No hay diferencia entre el stock del sistema y el físico");
      } else {
        message.success(`Ajuste realizado: ${result.previousStock} → ${result.newStock}`);
      }
      setAdjustTarget(null);
      reload();
    } catch {
      message.error("Error al realizar el ajuste");
    } finally {
      setAdjustLoading(false);
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    const sorted = [...data].sort((a, b) => b.stock - a.stock);
    try { 
      const lots = await fetchAllLots(); 
      exportToExcel(buildExportRows(sorted, lots), "Inventario_Lotes"); 
    }
    finally { setExporting(false); }
  }

  async function handleExportPdf() {
    const sorted = [...data].sort((a, b) => b.stock - a.stock);
    setExporting(true);
    try {
      const lots = await fetchAllLots();
      exportToPdf("Inventario con Lotes", [
        { header: "Código",        dataKey: "Codigo"       },
        { header: "Producto",      dataKey: "Nombre"       },
        { header: "Existencias",   dataKey: "Existencias"  },
        { header: "N° Compra",     dataKey: "N_Compra"     },
        { header: "Cantidad Lote", dataKey: "Cantidad_Lote"},
        { header: "Costo",         dataKey: "Costo"        },
        { header: "Expira",        dataKey: "Expira"       },
        { header: "Creado el",     dataKey: "Creado_el"    },
      ], buildExportRows(sorted, lots), "Inventario_Lotes");
    } finally { setExporting(false); }
  }

  function getRowMenu(record: InventoryRow): MenuProps {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("inventory", "view"))) {
      items.push({
        key: "detail", 
        label: "Ver detalle", 
        onClick: () => navigate(`/inventory/${record.id}`),
      });
    }

    if (canAccess(...getAllowedRoles("inventory", "manage"))) {
      items.push(
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
        {
          key: "adjust",
          label: "Ajustar inventario",
          onClick: () => setAdjustTarget(record),
        },
      );
    }

    return { items };
  }

  const exportMenu: MenuProps = useMemo(() => {
    const items: MenuProps["items"] = [];

    if (canAccess(...getAllowedRoles("inventory", "export"))) {
      items.push(
        { key: "excel", label: "Exportar Excel", icon: <FileExcelOutlined />, onClick: handleExportExcel },
        { key: "pdf",   label: "Exportar PDF",   icon: <FilePdfOutlined />,   onClick: handleExportPdf   },
      );
    }

    if(canAccess(...getAllowedRoles("inventory", "manage"))) {
      items.push(
        { key: "transfer-warehouse", label: "Trasladar bodega", onClick: () => setTransferWarehouse(true) },
      );
    }

    return { items };
  }, [canAccess]);

  const desktopColumns: ColumnsType<InventoryRow> = [
    { title: "Código",  dataIndex: "sku"  },
    { title: "Producto", dataIndex: "name" },
    {
      title: "Existencias", dataIndex: "stock",
      sorter: (a, b) => a.stock - b.stock,
      defaultSortOrder: "descend",
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
          <Col>
            <ProtectedButton
              roles={getAllowedRoles("inventory", "manage")}
              size={sizes.button}
              onClick={() => setAdjustTarget(record)}
            >
              Ajustar
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
      render: (_, r) => {
        const menu = getRowMenu(r);
        return (
          <div style={{ textAlign: "right" }}>
            {stockTag(r.stock)}
            {menu.items && menu.items.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
                  <Button icon={<MoreOutlined />} size="small" style={{ border: "none", boxShadow: "none" }} />
                </Dropdown>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Consulte el estado de su inventario"
        extra={
          isMobile ? (
            <div style={{ textAlign: "right" }}>
              {exportMenu.items && exportMenu.items.length > 0 && (
                <Dropdown menu={exportMenu} trigger={["click"]} placement="bottomRight">
                  <Button icon={<MoreOutlined />} size="small" loading={exporting} />
                </Dropdown>
              )}
            </div>
          ) : (
            <Space>
              <Button onClick={handleExportExcel} size={sizes.button} loading={exporting}>Exportar Excel</Button>
              <Button onClick={handleExportPdf}   size={sizes.button} loading={exporting}>Exportar PDF</Button>
              <ProtectedButton
                roles={getAllowedRoles("inventory", "manage")}
                size={sizes.button}
                onClick={() => setTransferWarehouse(true)}
              >
                Trasladar bodega
              </ProtectedButton>
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

      <TransferWarehouseModal
        open={transferWarehouse}
        onClose={() => setTransferWarehouse(false)}
        onSuccess={() => { setTransferWarehouse(false); reload(); }}
      />

      <AdjustInventoryModal
        open={adjustTarget !== null}
        product={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onConfirm={handleAdjust}
        loading={adjustLoading}
      />
    </>
  );
}