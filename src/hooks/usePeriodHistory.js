import { useState, useCallback, useMemo } from "react";
import { fetchBatteryHistory } from "../lib/api";
import { useDevice } from "../context/DeviceContext";
import { computePeriodStats, computeEnergyDeltas, buildPeriodSeries } from "../lib/periodAnalysis";

export function nowMs() {
  return Date.now();
}

export default function usePeriodHistory() {
  const { deviceId } = useDevice();
  const [range, setRange] = useState(null); // {start, end}
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (start, end, opts = {}) => {
      setLoading(true);
      setError("");
      try {
        const list = await fetchBatteryHistory(deviceId, start, end);
        setItems(list);
        setRange({ start, end });
        if (opts.refresh) setLoading(false);
      } catch (e) {
        setError(String(e?.message || e));
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(false);
    },
    [deviceId]
  );

  const stats = useMemo(() => computePeriodStats(items), [items]);
  const deltas = useMemo(() => computeEnergyDeltas(items), [items]);
  const series = useMemo(() => buildPeriodSeries(items), [items]);

  return { range, items, loading, error, load, stats, deltas, series };
}
