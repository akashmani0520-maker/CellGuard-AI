import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchLatestTelemetry, fetchBatteryHistory } from "../lib/api";
import { useDevice } from "../context/DeviceContext";
import { useMock } from "../context/MockContext";
import { generateSnapshot, generateHistory } from "../lib/mockData";

export default function useTelemetry() {
  const { deviceId, refreshMs } = useDevice();
  const { enabled: mockEnabled, scenario, overrides, animating } = useMock();

  // --- real data state ---
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({ loading: true, online: false, error: null, updatedAt: null });

  // --- mock animation tick ---
  const tickRef = useRef(0);

  // ========================================================
  // MOCK MODE — bypass real API, animate generated snapshots
  // ========================================================
  useEffect(() => {
    if (!mockEnabled) return;

    // Seed history immediately
    const hist = generateHistory(scenario, 60);
    setHistory(hist);
    setLatest(generateSnapshot(scenario, 0, overrides));
    setStatus({ loading: false, online: true, error: null, updatedAt: Date.now() });
    tickRef.current = 0;

    if (!animating) return; // static snapshot if paused

    const id = setInterval(() => {
      tickRef.current += 1;
      const snap = generateSnapshot(scenario, tickRef.current, overrides);
      setLatest(snap);
      setHistory((prev) => {
        const next = [...prev, snap];
        // keep last 600 points
        return next.length > 600 ? next.slice(next.length - 600) : next;
      });
      setStatus({ loading: false, online: true, error: null, updatedAt: Date.now() });
    }, Math.max(2000, refreshMs));

    return () => clearInterval(id);
  }, [mockEnabled, scenario, animating, refreshMs]);

  // Update latest immediately when overrides change (without resetting history)
  useEffect(() => {
    if (!mockEnabled) return;
    setLatest(generateSnapshot(scenario, tickRef.current, overrides));
  }, [overrides, mockEnabled, scenario]);

  // ========================================================
  // REAL MODE — normal AWS API polling
  // ========================================================
  const fetchAll = useCallback(async () => {
    if (mockEnabled) return;
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
  }, [deviceId, mockEnabled]);

  useEffect(() => {
    if (mockEnabled) return;
    setStatus((s) => ({ ...s, loading: true }));
    fetchAll();
    const id = setInterval(fetchAll, Math.max(2000, refreshMs));
    return () => clearInterval(id);
  }, [fetchAll, refreshMs, mockEnabled]);

  // Reset real data when switching out of mock mode
  useEffect(() => {
    if (!mockEnabled) {
      setLatest(null);
      setHistory([]);
      setStatus({ loading: true, online: false, error: null, updatedAt: null });
    }
  }, [mockEnabled]);

  // Ordered chart series from history
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
        pack_current: Math.abs(Number(x.telemetry.pack_current)) || 0,
        pack_power: Math.abs(Number(x.telemetry.pack_power)) || 0,
        soc: Number(x.telemetry.soc) || 0,
        temp0: Number((x.telemetry.temperature || [])[0]) || 0,
        temp1: Number((x.telemetry.temperature || [])[1]) || 0,
        temp2: Number((x.telemetry.temperature || [])[2]) || 0,
        maxTemp: Math.max(0, ...(x.telemetry.temperature || [0]).map(Number)),
      }));
  }, [history]);

  return { latest, history, series, status, refetch: fetchAll };
}
