import { Alert } from "antd";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handler = () => setOffline(true);

    window.addEventListener("api-offline", handler);

    return () => {
      window.removeEventListener("api-offline", handler);
    };
  }, []);

  useEffect(() => {
    function updateStatus() {
        if (!navigator.onLine) {
        setOffline(true);
        }
    }

    window.addEventListener("offline", updateStatus);
    window.addEventListener("online", () => setOffline(false));

    return () => {
        window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!offline) return null;

  return (
    <Alert
      type="error"
      message="Sin conexión con el servidor"
      banner
    />
  );
}