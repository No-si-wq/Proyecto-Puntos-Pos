import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#1677ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",

    colorBgBase: "#f5f5f5",
    colorBgContainer: "#ffffff",

    colorTextBase: "#1f1f1f",
    fontFamily: "'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif",

    borderRadius: 6,

    padding: 16,
  },

  components: {
    Layout: {
      bodyBg: "#f5f5f5",
      headerBg: "#ffffff",
      siderBg: "#001529",
    },

    Menu: {
      darkItemBg: "#001529",
      darkItemSelectedBg: "#1677ff",
      darkItemHoverBg: "#0f6ae0",
    },

    Button: {
      borderRadius: 6,
      controlHeight: 36,
    },

    Card: {
      borderRadius: 8,
    },

    Table: {
      headerBg: "#fafafa",
      borderColor: "#f0f0f0",
    },

    Modal: {
      borderRadius: 8,
    },
  },
};

export default theme;