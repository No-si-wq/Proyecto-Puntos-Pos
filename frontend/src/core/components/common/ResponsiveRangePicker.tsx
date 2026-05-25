import { DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import { useDeviceType } from "../../hooks/useDeviceType";
import type { Dayjs } from "dayjs";
import { useState, useEffect } from "react";

const { RangePicker } = DatePicker;

interface ResponsiveRangePickerProps extends RangePickerProps {}

export default function ResponsiveRangePicker({
  value,
  onChange,
  ...props
}: ResponsiveRangePickerProps) {
  const { isMobile, isTablet, isPortrait } = useDeviceType();
  const isMobileLike = isMobile || (isTablet && isPortrait);

  // Estado interno para los dos pickers individuales
  const [startDate, setStartDate] = useState<Dayjs | null>(
    (value as [Dayjs, Dayjs])?.[0] ?? null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    (value as [Dayjs, Dayjs])?.[1] ?? null
  );

  // Sincronizar si el valor cambia desde afuera (ej: reset del form)
  useEffect(() => {
    setStartDate((value as [Dayjs, Dayjs])?.[0] ?? null);
    setEndDate((value as [Dayjs, Dayjs])?.[1] ?? null);
  }, [value]);

  const handleStartChange = (date: Dayjs | null) => {
    setStartDate(date);
    // Si la fecha fin es anterior a la nueva fecha inicio, limpiarla
    const newEnd = endDate && date && endDate.isBefore(date) ? null : endDate;
    setEndDate(newEnd);
    if (onChange) {
      onChange(
        date && newEnd ? [date, newEnd] : null,
        ["", ""]
      );
    }
  };

  const handleEndChange = (date: Dayjs | null) => {
    setEndDate(date);
    if (onChange) {
      onChange(
        startDate && date ? [startDate, date] : null,
        ["", ""]
      );
    }
  };

  // En desktop/tablet landscape → RangePicker normal
  if (!isMobileLike) {
    return (
      <RangePicker
        {...props}
        value={value}
        onChange={onChange}
        style={{ width: "100%", ...(props.style || {}) }}
        placement="bottomLeft"
      />
    );
  }

  // En móvil/tablet portrait → Dos DatePicker apilados
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <DatePicker
        {...(props as any)}
        placeholder="Fecha inicio"
        value={startDate}
        onChange={handleStartChange}
        style={{ width: "100%" }}
        inputReadOnly
        disabledDate={(d, info) =>
          props.disabledDate ? props.disabledDate(d, info as any) : false
        }
      />
      <DatePicker
        {...(props as any)}
        placeholder="Fecha fin"
        value={endDate}
        onChange={handleEndChange}
        style={{ width: "100%" }}
        inputReadOnly
        // No permitir fecha fin anterior a fecha inicio
        disabledDate={(d, info) => {
          if (startDate && d.isBefore(startDate, "day")) return true;
          return props.disabledDate ? props.disabledDate(d, info as any) : false;
        }}
      />
    </div>
  );
}