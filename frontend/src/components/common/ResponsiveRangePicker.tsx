import { DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import { useDeviceType } from "../../hooks/useDeviceType";

const { RangePicker } = DatePicker;

interface ResponsiveRangePickerProps extends RangePickerProps {}

export default function ResponsiveRangePicker(
  props: ResponsiveRangePickerProps
) {
  const {
    device,
    isMobile,
    isTablet,
    isPortrait,
  } = useDeviceType();

  const popupClass = [
    "responsive-range-advanced",
    isMobile && isPortrait && "rr-mobile-portrait",
    isTablet && "rr-tablet",
    device === "desktop" && "rr-desktop",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <RangePicker
      {...props}
      style={{
        width: "100%",
        ...(props.style || {}),
      }}
      placement="bottomLeft"
      inputReadOnly={isMobile}
      popupClassName={popupClass}
    />
  );
}