import { useEffect, useState } from "react";

export type DeviceType =
  | "mobile"
  | "tablet"
  | "desktop";

function getDeviceType(): DeviceType {
  if (window.matchMedia("(min-width: 1200px)").matches) {
    return "desktop";
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    return "tablet";
  }

  return "mobile";
}

function getOrientation(): "portrait" | "landscape" {
  return window.matchMedia("(orientation: portrait)").matches
    ? "portrait"
    : "landscape";
}

function getStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function useDeviceType() {
  const [device, setDevice] =
    useState<DeviceType>(getDeviceType);

  const [orientation, setOrientation] =
    useState<"portrait" | "landscape">(
      getOrientation
    );

  const [isStandalone, setIsStandalone] =
    useState<boolean>(getStandalone);

  useEffect(() => {
    const deviceQueries = [
      window.matchMedia("(min-width: 1200px)"),
      window.matchMedia("(min-width: 768px)"),
    ];

    const orientationQuery =
      window.matchMedia(
        "(orientation: portrait)"
      );

    const standaloneQuery =
      window.matchMedia("(display-mode: standalone)");

    const handleDeviceChange = () => {
      setDevice(getDeviceType());
    };

    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    const handleStandaloneChange = () => {
      setIsStandalone(getStandalone());
    };

    deviceQueries.forEach((mq) =>
      mq.addEventListener(
        "change",
        handleDeviceChange
      )
    );

    orientationQuery.addEventListener(
      "change",
      handleOrientationChange
    );

    standaloneQuery.addEventListener(
      "change",
      handleStandaloneChange
    );

    return () => {
      deviceQueries.forEach((mq) =>
        mq.removeEventListener(
          "change",
          handleDeviceChange
        )
      );

      orientationQuery.removeEventListener(
        "change",
        handleOrientationChange
      );
      standaloneQuery.removeEventListener(
        "change",
        handleStandaloneChange
      );
    };
  }, []);

  return {
    device,
    orientation,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    isPortrait:
      orientation === "portrait",
    isLandscape:
      orientation === "landscape",
    isStandalone,
  };
}