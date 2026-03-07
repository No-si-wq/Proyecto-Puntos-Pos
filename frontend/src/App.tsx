import { ConfigProvider, App as AntdApp } from "antd";
import AppRouter from "./core/router";
import theme from "./core/styles/theme";

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
}