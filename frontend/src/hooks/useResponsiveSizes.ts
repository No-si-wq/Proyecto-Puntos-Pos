import { useDeviceType } from "./useDeviceType";
import { getDensity } from "../types/density";

export function useResponsiveSizes() {
  const { device } = useDeviceType();
  return getDensity(device);
}