import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchLatestTelemetry, fetchBatteryHistory } from "../lib/api";
import { useDevice } from "../context/DeviceContext";

export default function useTelemetry() {
  const { deviceId, refreshMs } = useDevice();
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({ loading: true, online: false, error: null, updatedAt: null });

  const fetchAll = useCallback(async () => {
    try {
      const SIX_HOURS_MS = 6 * 3600 * 1000;
      const [latestItem, historyItems] = await Promise.all([
        fetchLatestTelemetry(deviceId),
        fetchBatteryHistory(deviceId, Date.now() - SIX_HOURS_MS),
      ]);
      if (latestItem) {
        setLatest(latestItem);
        setStatus((s) => ({
          ...s, loading: false, online: true, error: null, updatedAt: Date.now(),
        }));
      }
      if (Array.isArray(historyItems) && historyItems.length) {
        setHistory((prev) => {
          const merged = historyItems.concat(prev);
          // keep most recent 600 points, dedupe by timestamp
          const map = new Map();
          merged.forEach((x) => map.set(String(x.timestamp), x));
          return Array.from(map.values())
            .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
            .slice(-600);
        });
      }
    } catch (error) {
      setStatus((s) => ({
        ...s, loading: false, online: false, error: String(error?.message || error),
      }));
    }
  }, [deviceId]);

  useEffect(() => {
    setStatus((s) => ({ ...s, loading: true }));
    fetchAll();
    const id = setInterval(fetchAll, Math.max(2000, refreshMs));
    return () => clearInterval(id);
  }, [fetchAll, refreshMs]);

  // Ordered chart series from history (dedup + ascending).
  const series = useMemo(() => {
    if (!history.length) return [];
    return history
      .slice()
      .filter((x) => x && x.telemetry)
      .map((x) => ({
        t: Number(x.timestamp) || 0,
        label: Number(x.timestamp)
          ? new Date(Number(x.timestamp)).toLocaleTimeString([], { hour12: false })
          : "",
        pack_voltage: Number(x.telemetry.pack_voltage) || 0,
        pack_current: Number(x.telemetry.pack_current) || 0,
        pack_power: Number(x.telemetry.pack_power) || 0,
        soc: Number(x.telemetry.soc) || 0,
        temp0: Number((x.telemetry.temperature || [])[0]) || 0,
        temp1: Number((x.telemetry.temperature || [])[1]) || 0,
        temp2: Number((x.telemetry.temperature || [])[2]) || 0,
        maxTemp: Math.max(0, ...(x.telemetry.temperature || [0]).map(Number)),
      }));
  }, [history]);

  return { latest, history, series, status, refetch: fetchAll };
}
