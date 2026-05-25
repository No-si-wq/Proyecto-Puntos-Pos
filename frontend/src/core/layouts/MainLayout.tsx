import { useMemo, useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Dropdown,
  Button,
  Drawer,
  Select,
  Space,
} from "antd";
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  ContactsOutlined,
  CreditCardOutlined,
  TagsOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  FileTextFilled,
  PercentageOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  TruckOutlined,
  BankOutlined,
  ProfileOutlined,
  UnorderedListOutlined,
  FundOutlined,
  LogoutOutlined,
  MenuOutlined,
  LineChartOutlined,
  LayoutOutlined,
  SettingFilled,
  ProductFilled,
  TruckFilled,
  SolutionOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useWarehouses } from "../../modules/warehouses/hooks/useWarehouse";
import { Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "../../modules/auth/useLogout";
import { authStore } from "../../modules/auth/auth.store";
import { canAccess, type PermissionModule, type PermissionAction } from "../utils/permissions";
import { useDeviceType } from "../hooks/useDeviceType";
import { OfflineBanner } from "../../modules/OfflineBanner";
import { useResponsiveSizes } from "../hooks/useResponsiveSizes";
import { useVisualViewport } from "../hooks/useVisualViewport";
import { Role } from "../auth/roles";

const { Header, Content } = Layout;

export default function MainLayout() {
  const activeWarehouseId = authStore((s) => s.activeWarehouseId);
  const setActiveWarehouse = authStore((s) => s.setActiveWarehouse);
  const sizes = useResponsiveSizes();
  const { warehouses } = useWarehouses();
  const navigate = useNavigate();
  const logout = useLogout();
  const user = authStore((s) => s.user);
  const isNotSeller = user?.role !== Role.SELLER;

  const { device, orientation, isMobile, isTablet, isDesktop, isPortrait, isStandalone } =
    useDeviceType();

  const isTabletLandscape = device === "tablet" && orientation === "landscape";
  const isDesktopLike = isDesktop || isTabletLandscape;
  const isMobileLike = isMobile || (isTablet && isPortrait);
  const isInstalledDesktop = isStandalone && isDesktopLike;

  const viewportHeight = useVisualViewport();

  // Altura total del header: barra superior + barra de menú (solo desktop)
  const topBarHeight = isInstalledDesktop ? 52 : 56;
  const menuBarHeight = isDesktopLike ? 46 : 0;
  const headerHeight = topBarHeight + menuBarHeight;

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ── Construcción del menú ───────────────────────────────────────────────────
  // Helper: un ítem de menú con campo `visible`
  type RawItem = {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    visible: boolean;
    children?: RawItem[];
  };

  const rawGroups = useMemo((): RawItem[] => {
    if (!user) return [];

    const can = (resource: PermissionModule, action: PermissionAction = "view") =>
      canAccess(user.role, resource, action);

    return [
      // ── Dashboard ──────────────────────────────────────────────────────────
      {
        key: "/dashboard-root",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        onClick: () => navigate(can("dashboard_admin") ? "/admin-dashboard" : "/dashboard"),
        visible: can("dashboard_admin") || can("dashboard"),
      },

      // ── Ventas ─────────────────────────────────────────────────────────────
      {
        key: "g-ventas",
        label: "Ventas",
        icon: <ShoppingOutlined />,
        visible: true,
        children: [
          {
            key: "/sales",
            label: "Ventas",
            icon: <ShoppingOutlined />,
            onClick: () => navigate("/sales"),
            visible: can("sales"),
          },
          {
            key: "/sales/history",
            label: "Panel de Ventas",
            icon: <LineChartOutlined />,
            onClick: () => navigate("/sales/history"),
            visible: can("salehistory"),
          },
          {
            key: '/quotations',
            label: 'Cotizaciones',
            icon: <FileTextFilled />,
            onClick: () => navigate('/quotations'),
            visible: can('sales'),
          },
          {
            key: "/remissions",
            label: "Remisiones",
            icon: <SolutionOutlined />,
            onClick: () => navigate("/remissions"),
            visible: can("sales"),
          },
          {
            key: "/customers",
            label: "Clientes",
            icon: <ContactsOutlined />,
            onClick: () => navigate("/customers"),
            visible: can("customers"),
          },
          {
            key: "/accounts-receivable",
            label: "Crédito Clientes",
            icon: <CreditCardOutlined />,
            onClick: () => navigate("/accounts-receivable"),
            visible: can("accountsReceivable"),
          },
        ],
      },

      // ── Compras ────────────────────────────────────────────────────────────
      {
        key: "g-compras",
        label: "Compras",
        icon: <ShoppingCartOutlined />,
        visible: true,
        children: [
          {
            key: "/purchases",
            label: "Nueva Compra",
            icon: <ShoppingCartOutlined />,
            onClick: () => navigate("/purchases"),
            visible: can("purchases"),
          },
          {
            key: "/purchases/history",
            label: "Historial de Compras",
            icon: <FileTextOutlined />,
            onClick: () => navigate("/purchases/history"),
            visible: can("purchasehistory"),
          },
          {
            key: "/suppliers",
            label: "Proveedores",
            icon: <TruckOutlined />,
            onClick: () => navigate("/suppliers"),
            visible: can("suppliers"),
          },
          {
            key: "/accounts-payable",
            label: "Cuentas por Pagar",
            icon: <BankOutlined />,
            onClick: () => navigate("/accounts-payable"),
            visible: can("accountPayable"),
          },
          {
            key: "/purchases-report",
            label: "Lotes de Compra",
            icon: <ProfileOutlined />,
            onClick: () => navigate("/purchases-report"),
            visible: can("purchasesreport"),
          },
        ],
      },

      // ── Inventario ─────────────────────────────────────────────────────────
      {
        key: "g-inventario",
        label: "Inventario",
        icon: <InboxOutlined />,
        visible: true,
        children: [
          {
            key: "/inventory",
            label: "Inventario",
            icon: <InboxOutlined />,
            onClick: () => navigate("/inventory"),
            visible: can("inventory"),
          },
          {
            key: "/products",
            label: "Productos",
            icon: <AppstoreOutlined />,
            onClick: () => navigate("/products"),
            visible: can("products"),
          },
          {
            key: "/category",
            label: "Categorías",
            icon: <UnorderedListOutlined />,
            onClick: () => navigate("/category"),
            visible: can("category"),
          },
          {
            key: "/price-lists",
            label: "Listas de Precios",
            icon: <TagsOutlined />,
            onClick: () => navigate("/price-lists"),
            visible: can("priceList"),
          },
        ],
      },

      // ── Reportes ───────────────────────────────────────────────────────────
      {
        key: "g-reportes",
        label: "Reportes",
        icon: <BarChartOutlined />,
        visible: true,
        children: [
          {
            key: "/reports/profit",
            label: "Utilidad en Ventas",
            icon: <FundOutlined />,
            onClick: () => navigate("/reports/profit"),
            visible: can("reports"),
          },
          {
            key: "/reports/sold-products",
            label: "Productos Vendidos",
            icon: <ProductFilled />,
            onClick: () => navigate("/reports/sold-products"),
            visible: can("reports"),
          },
          {
            key: "/reports/product-outputs",
            label: "Salida de Productos",
            icon: <ExportOutlined />,
            onClick: () => navigate("/reports/product-outputs"),
            visible: can("reports"),
          },
          {
            key: "/inventory/transfers/report",
            label: "Reporte de Transferencias",
            icon: <TruckFilled />,
            onClick: () => navigate("/inventory/transfers/report"),
            visible: can("inventory"),
          },
          {
            key: "/reports/kardex",
            label: "Kardex",
            icon: <DollarOutlined />,
            onClick: () => navigate("/reports/kardex"),
            visible: can("reports"),
          },
          {
            key: "/commissionReports",
            label: "Comisión de Vendedores",
            icon: <BarChartOutlined />,
            onClick: () => navigate("/commissionReports"),
            visible: can("commissionReport"),
          },
        ],
      },

      // ── Configuración ──────────────────────────────────────────────────────
      {
        key: "g-config",
        label: "Configuración",
        icon: <SettingFilled />,
        visible: true,
        children: [
          {
            key: "/users",
            label: "Usuarios",
            icon: <TeamOutlined />,
            onClick: () => navigate("/users"),
            visible: can("users"),
          },
          {
            key: "/warehouses",
            label: "Almacenes",
            icon: <ShopOutlined />,
            onClick: () => navigate("/warehouses"),
            visible: can("warehouse"),
          },
          {
            key: "/commissions",
            label: "Comisiones",
            icon: <PercentageOutlined />,
            onClick: () => navigate("/commissions"),
            visible: can("commission"),
          },
          {
            key: "/settings",
            label: "Ajustes del Sistema",
            icon: <SettingFilled />,
            onClick: () => navigate("/settings"),
            visible: can("settings"),
          },
          {
            key: "/reports/design",
            label: "Plantillas de Facturas",
            icon: <LayoutOutlined />,
            onClick: () => navigate("/reports/design"),
            visible: can("reports"),
          },
        ],
      },
    ];
  }, [navigate, user]);

  // Filtra los ítems y sus hijos según `visible`, descarta grupos vacíos
  const menuItems = useMemo(() => {
    return rawGroups
      .map((group) => {
        if (!group.children) {
          return group.visible ? { key: group.key, label: group.label, icon: group.icon, onClick: group.onClick } : null;
        }
        const visibleChildren = group.children
          .filter((c) => c.visible)
          .map(({ key, label, icon, onClick }) => ({ key, label, icon, onClick }));

        if (visibleChildren.length === 0) return null;

        // Si solo hay un hijo visible, aplana el grupo (evita menú de 1 ítem)
        if (visibleChildren.length === 1) {
          return { ...visibleChildren[0] };
        }

        return { key: group.key, label: group.label, icon: group.icon, children: visibleChildren };
      })
      .filter(Boolean);
  }, [rawGroups]);

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Cerrar sesión",
        onClick: logout,
      },
    ],
  };

  if (!user) return null;

  return (
    <Layout style={{ minHeight: "100dvh" }}>
      {/* ── Header container (dos filas en desktop) ─────────────────────── */}
      <Header
        style={{
          background: "#001529",
          padding: 0,
          height: headerHeight,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* ── Fila superior: logo + selector almacén + usuario ──────────── */}
        <div
          style={{
            height: topBarHeight,
            padding: isMobileLike ? "0 12px" : "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: isDesktopLike ? "1px solid rgba(255,255,255,0.08)" : "none",
          }}
        >
          {/* Hamburger (solo móvil) */}
          {isMobileLike && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: "white", fontSize: 18 }} />}
              onClick={() => setDrawerOpen(true)}
              style={{ padding: "0 6px" }}
            />
          )}

          {/* Logo / nombre del sistema */}
          <span
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: isMobileLike ? 15 : 17,
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
            }}
          >
            POS System
          </span>

          {/* Selector de almacén (centrado) */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0, overflow: "hidden" }}>
            {isNotSeller && !isMobileLike && (
              <Select
                placeholder="Almacén"
                size={sizes.select}
                style={{
                  width: isInstalledDesktop ? 220 : 260,
                  maxWidth: "100%",  
                }}
                value={activeWarehouseId}
                onChange={setActiveWarehouse}
                dropdownMatchSelectWidth={false}
                options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
              />
            )}
          </div>

          {/* Menú de usuario */}
          <Dropdown menu={userMenu} placement="bottomRight">
            {isDesktopLike ? (
              <Space
                size="small"
                style={{
                  cursor: "pointer",
                  color: "white",
                  padding: "4px 10px",
                  borderRadius: 6,
                  transition: "background 0.2s",
                }}
                className="user-menu-trigger"
              >
                <UserOutlined />
                <span style={{ fontSize: 13 }}>{user.name}</span>
              </Space>
            ) : (
              <Button
                type="text"
                icon={<UserOutlined style={{ color: "white" }} />}
              />
            )}
          </Dropdown>
        </div>

        {/* ── Fila inferior: menú horizontal (solo desktop) ─────────────── */}
        {isDesktopLike && (
          <div style={{ height: menuBarHeight, display: "flex", alignItems: "center", paddingLeft: 16 }}>
            <Menu
              theme="dark"
              mode="horizontal"
              items={menuItems as any}
              getPopupContainer={() => document.body}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                borderBottom: "none",
                lineHeight: `${menuBarHeight}px`,
                fontSize: 13,
              }}
              overflowedIndicator={
                <Space size={4} style={{ color: "rgba(255,255,255,0.85)" }}>
                  <MenuOutlined />
                  <span style={{ fontSize: 12 }}>Más</span>
                </Space>
              }
            />
          </div>
        )}
      </Header>

      {/* ── Drawer para móvil ────────────────────────────────────────────── */}
      {isMobileLike && (
        <Drawer
          placement="left"
          width={280}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          maskClosable
          keyboard={false}
          destroyOnClose
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#1677ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UserOutlined style={{ color: "white", fontSize: 16 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: 11, color: "#888", lineHeight: 1.2 }}>
                  {user.role}
                </span>
              </div>
            </div>
          }
          footer={
            <Button
              block
              danger
              icon={<LogoutOutlined />}
              onClick={() => { setDrawerOpen(false); logout(); }}
            >
              Cerrar sesión
            </Button>
          }
          bodyStyle={{
            padding: 0,
            height: "100%",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "none",
            display: "flex",
            flexDirection: "column",
          }}
          rootStyle={{ overscrollBehavior: "none" }}
        >
          {/* Selector de almacén dentro del drawer */}
          {isNotSeller && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
              <Select
                placeholder="Seleccionar almacén"
                size="middle"
                style={{ width: "100%" }}
                value={activeWarehouseId}
                onChange={setActiveWarehouse}
                dropdownMatchSelectWidth={false}
                options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
              />
            </div>
          )}

          {/* Menú agrupado con submenús colapsables */}
          <Menu
            mode="inline"
            items={menuItems as any}
            style={{ flex: 1, borderRight: "none" }}
            onClick={() => setDrawerOpen(false)}
          />
        </Drawer>
      )}

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <Layout
        style={{
          marginTop: headerHeight,
          display: "flex",
          flexDirection: "column",
          height: isMobileLike
            ? viewportHeight - headerHeight
            : `calc(100dvh - ${headerHeight}px)`,
          overflow: "hidden",
        }}
      >
        <Content
          style={{
            padding: isMobileLike ? 16 : isInstalledDesktop ? 16 : 24,
            height: "100%",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
          }}
        >
          <OfflineBanner />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}