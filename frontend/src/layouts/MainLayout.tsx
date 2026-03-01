import {
  Layout,
  Menu,
  Dropdown,
  Button,
  Drawer,
  Select,
  Space
} from "antd";
import { useMemo, useState, useEffect } from "react";
import {
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useWarehouses } from "../hooks/useWarehouse";
import { Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";
import { authStore } from "../store/auth.store";
import { canAccess } from "../utils/permissions";
import { useDeviceType } from "../hooks/useDeviceType";
import { OfflineBanner } from "../pages/OfflineBanner";
import { useResponsiveSizes } from "../hooks/useResponsiveSizes";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const activeWarehouseId = authStore(s => s.activeWarehouseId);
  const setActiveWarehouse = authStore(s => s.setActiveWarehouse);
  const sizes = useResponsiveSizes();
  const { warehouses } = useWarehouses();
  const navigate = useNavigate();
  const logout = useLogout();
  const user = authStore((s) => s.user);

  const {
    device,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isStandalone,
  } = useDeviceType();

  const isTabletLandscape =
    device === "tablet" && orientation === "landscape";

  const isDesktopLike =
    isDesktop || isTabletLandscape

  const isMobileLike =
    isMobile || (isTablet && isPortrait)

  const isInstalledDesktop =
    isStandalone && isDesktopLike

  const showSider = isDesktopLike

  const collapsed =
    isDesktop
      ? false
      : isTabletLandscape

  const [drawerOpen, setDrawerOpen] =
    useState(false);

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

    if (!user) return null;

    const menuItems = useMemo(
      () =>
        [
          {
            key: "/admin-dashboard",
            label: "Dashboard",
            onClick: () => navigate("/admin-dashboard"),
            visible: canAccess(user.role, "dashboard_admin", "view"),
          },
          {
            key: "/dashboard",
            label: "Dashboard",
            onClick: () => navigate("/dashboard"),
            visible: canAccess(user.role, "dashboard", "view"),
          },
          {
            key: "/warehouses",
            label: "Almacenes",
            onClick: () => navigate("/warehouses"),
            visible: canAccess( user.role, "warehouse", "view"),
          },
          {
            key: "/users",
            label: "Usuarios",
            onClick: () => navigate("/users"),
            visible: canAccess( user.role, "users", "view"),
          },
          {
            key: "/customers",
            label: "Clientes",
            onClick: () => navigate("/customers"),
            visible: canAccess( user.role, "customers", "view"),
          },
          {
            key: "/accounts-receivable",
            label: "Credito Clientes",
            onClick: () => navigate("/accounts-receivable"),
            visible: canAccess( user.role, "accountsReceivable", "view"),
          },
          {
            key: "/products",
            label: "Productos",
            onClick: () => navigate("/products"),
            visible: canAccess( user.role, "products", "view"),
          },
          {
            key: "/inventory",
            label: "Inventario",
            onClick: () => navigate("/inventory"),
            visible: canAccess( user.role, "inventory", "view"),
          },
          {
            key: "/purchases",
            label: "Compras",
            onClick: () => navigate("/purchases"),
            visible: canAccess( user.role, "purchases", "view"),
          },
          {
            key: "/purchases/history",
            label: "Reporte de Compras",
            onClick: () => navigate("/purchases/history"),
            visible: canAccess( user.role, "purchasehistory", "view"),
          },
          {
            key: "/sales",
            label: "Ventas",
            onClick: () => navigate("/sales"),
            visible: canAccess( user.role, "sales", "view"),
          },
          {
            key: "/sales/history",
            label: "Panel de Ventas",
            onClick: () => navigate("/sales/history"),
            visible: canAccess( user.role, "salehistory", "view"),
          },
          {
            key: "/suppliers",
            label: "Proveedores",
            onClick: () => navigate("/suppliers"),
            visible: canAccess( user.role, "suppliers", "view"),
          },
          {
            key: "/accounts-payable",
            label: "Cuentas por pagar",
            onClick: () => navigate("/accounts-payable"),
            visible: canAccess( user.role, "accountPayable", "view"),
          },
          {
            key: "/purchases-report",
            label: "Lote de compras",
            onClick: () => navigate("/purchases-report"),
            visible: canAccess( user.role, "purchasesreport", "view"),
          },
          {
            key: "/category",
            label: "Categorias",
            onClick: () => navigate("/category"),
            visible: canAccess( user.role, "category", "view"),
          },
        ].filter((i) => i.visible),
      [navigate, user.role]
    );

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

  return (
    <Layout style={{ minHeight: "100dvh" }}>
      {showSider && (
        <Sider
          collapsible
          collapsed={collapsed}
          collapsedWidth={80}
          trigger={null}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            transition: "all 0.25s ease",
            scrollbarWidth: 'thin',
            scrollbarColor: 'unset',
          }}
        >
          <div
            style={{
              height: 48,
              margin: 16,
              color: "white",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {collapsed
              ? "POS"
              : "POS System"}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            items={menuItems}
          />
        </Sider>
      )}

      <Layout
        style={{
          marginLeft:
            showSider
              ? collapsed
                ? 80
                : 200
              : 0,
          transition: "all 0.2s",
          display: "flex",
          flexDirection:"column",
          minHeight: "100%",
        }}
      >
      <Header
        style={{
          background: "#fff",
          padding: isMobileLike ? "0 12px" : "0 16px",
          height: isInstalledDesktop ? 56 : 64,
          display: "flex",
          alignItems: "center",
          boxShadow: isInstalledDesktop
            ? "none"
            : "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ width: 48 }}>
          {(isMobile || (isTablet && isPortrait)) && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Select
            placeholder="Almacén"
            size={sizes.select}
            style={{
              width: isMobileLike
                ? "100%"
                : isInstalledDesktop
                  ? 220
                  : 260,
            }}
            value={activeWarehouseId}
            onChange={setActiveWarehouse}
            dropdownMatchSelectWidth={false}
            options={warehouses.map((w) => ({
              label: w.name,
              value: w.id,
            }))}
          />
        </div>

        <div
          style={{
            width:
              isDesktopLike
                ? 180
                : 48,
            textAlign: "right",
          }}
        >
          <Dropdown menu={userMenu}>
            {isDesktopLike ? (
              <Space
                size="middle"
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 6,
                }}
              >
                <UserOutlined />
                {user.name}
              </Space>
            ) : (
              <Button
                type="text"
                icon={<UserOutlined />}
              />
            )}
          </Dropdown>
        </div>
      </Header>
      {isMobileLike && (
        <Drawer
          placement="left"
          width={280}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          maskClosable
          keyboard={false}
          destroyOnClose
          bodyStyle={{
            padding: 0,
            height: "100%",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "none",
          }}
          rootStyle={{
            overscrollBehavior: "none",
          }}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overscrollBehavior: "none",
            }}
          >
            <Menu
              mode="inline"
              items={menuItems}
              style={{ flex: 1 }}
              onClick={() => setDrawerOpen(false)}
            />
          </div>
        </Drawer>
      )}
      <Content
        style={{
          padding: isMobileLike ? 16 : isInstalledDesktop ? 16 : 24,
          height: `calc(100dvh - ${isInstalledDesktop ? 56 : 64}px)`,
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