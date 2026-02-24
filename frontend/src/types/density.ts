export type DeviceType = "mobile" | "tablet" | "desktop";

export interface UIDensity {
  button: "small" | "middle" | "large";
  input: "small" | "middle" | "large";
  select: "small" | "middle" | "large";
  table: "small" | "middle";
  selectListHeight: number;
  gutter: number;
  cardPadding: number;
  gap: number;
  totalFontSize: number;
  minTouchHeight: number;
  bottomBarHeight: number;

  modalWidth: number | string;
  modalFullscreen: boolean;
}

export function getDensity(device: DeviceType): UIDensity {
  switch (device) {
    case "mobile":
      return {
        button: "large",
        input: "large",
        select: "large",
        table: "middle",
        selectListHeight: 320,
        gutter: 12,
        cardPadding: 12,
        gap: 16,
        totalFontSize: 22,
        minTouchHeight: 48,
        bottomBarHeight: 88,
        modalWidth: "100%",
        modalFullscreen: true,
      };

    case "tablet":
      return {
        button: "large",
        input: "large",
        select: "large",
        table: "middle",
        selectListHeight: 300,
        gutter: 16,
        cardPadding: 20,
        gap: 20,
        totalFontSize: 24,
        minTouchHeight: 48,
        bottomBarHeight: 80,
        modalWidth: "85%",
        modalFullscreen: false,
      };

    default: // desktop 
      return {
        button: "middle",
        input: "middle",
        select: "middle",
        table: "small",
        selectListHeight: 260,
        gutter: 24,
        cardPadding: 24,
        gap: 24,
        totalFontSize: 28,
        minTouchHeight: 40,
        bottomBarHeight: 0,
        modalWidth: 600,
        modalFullscreen: false,
      };
  }
}