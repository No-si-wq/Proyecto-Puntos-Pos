import { Layout } from "antd";
import type { ReactNode } from "react";
import { useDeviceType } from "../hooks/useDeviceType";

const { Content } = Layout;

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({
  children,
}: AuthLayoutProps) {
  const {isMobile} = useDeviceType();
  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0f2f5 0%, #e6f0ff 100%)",
      }}
    >
      <Content
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          paddingTop: 80,
          justifyContent: "center",
          padding: 16,
          paddingBottom:
            "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
          }}
        >
          {children}
        </div>
      </Content>
    </Layout>
  );
}