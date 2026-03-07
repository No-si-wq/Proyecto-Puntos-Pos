import { Breadcrumb, Space, Typography } from "antd";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  breadcrumb?: Array<{ title: string }>;
}

export default function PageHeader({
  title,
  subtitle,
  extra,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      {breadcrumb?.length ? <Breadcrumb items={breadcrumb} /> : null}

      <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
        <Space direction="vertical" size={0}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle ? (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          ) : null}
        </Space>
        {extra ? <Space>{extra}</Space> : null}
      </Space>
    </Space>
  );
}