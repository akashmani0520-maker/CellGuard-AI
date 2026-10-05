import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DEFAULT_DEVICE_ID } from "../lib/api";

const DeviceContext = createContext(null);

function readStoredDevice() {
  try {
    return localStorage.getItem("cellguard.device") || DEFAULT_DEVICE_ID;
  } catch {
    return DEFAULT_DEVICE_ID;
  }
}

export function DeviceProvider({ children }) {
  const [deviceId, setDeviceIdState] = useState(readStoredDevice);
  const [refreshMs, setRefreshMs] = useState(5000);

  const setDeviceId = useCallback((id) => {
    const next = (id || DEFAULT_DEVICE_ID).trim() || DEFAULT_DEVICE_ID;
    setDeviceIdState(next);
    try {
      localStorage.setItem("cellguard.device", next);
    } catch {}
  }, []);

  // Persist refresh rate too.
  useEffect(() => {
    try {
      localStorage.setItem("cellguard.refresh", String(refreshMs));
    } catch {}
  }, [refreshMs]);

  const value = { deviceId, setDeviceId, refreshMs, setRefreshMs };
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}
