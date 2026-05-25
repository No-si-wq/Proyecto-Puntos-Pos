import { Layout } from "antd";
import { type ReactNode, useEffect } from "react";
import { useDeviceType } from "../hooks/useDeviceType";

const { Content } = Layout;

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isMobile } = useDeviceType();

  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => document.body.classList.remove("auth-page");
  }, []);

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f2f5 0%, #e6f0ff 100%)",
      }}
    >
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflowY: "auto",
          minHeight: "100vh",
          padding: isMobile
            ? `24px 16px calc(24px + env(safe-area-inset-bottom))`
            : `40px 16px calc(40px + env(safe-area-inset-bottom))`,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            marginTop: "auto",
            marginBottom: "auto",
          }}
        >
          {children}
        </div>
      </Content>
    </Layout>
  );
}