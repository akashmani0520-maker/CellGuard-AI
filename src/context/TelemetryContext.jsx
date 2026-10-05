import { createContext, useContext } from "react";
import useTelemetry from "../hooks/useTelemetry";

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const telemetry = useTelemetry();
  return <TelemetryContext.Provider value={telemetry}>{children}</TelemetryContext.Provider>;
}

export function useTelemetryCtx() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetryCtx must be used within TelemetryProvider");
  return ctx;
}
