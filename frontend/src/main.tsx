import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";

import AppRouter from "./core/router";
import theme from "./core/styles/theme";
import "./core/styles/global.css";

import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    console.log('Nueva versión disponible')
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline')
  },
});

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <ConfigProvider theme={theme}>
      <AppRouter />
    </ConfigProvider>
  </React.StrictMode>
);