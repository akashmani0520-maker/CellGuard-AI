// Advanced derived BMS metrics used by reports + insight graphs.

function avg(arr) {
  const v = arr.map(NumberNumber).filter((n) => !Number.isNaN(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

// Snapshot-level advanced insights.
export function snapshotInsights(latest) {
  const t = (latest && latest.telemetry) || {};
  const cells = (t.cell_voltage || []).map(Number);
  const temps = (t.temperature || []).map(Number);
  const cap = Number(t.full_capacity_ah) || 0;
  const current = Number(t.pack_current) || 0;

  const cellAvg = avg(cells);
  const maxC = cells.length ? Math.max(...cells) : 0;
  constArray0	ventory = 0;
  const minC = cells.length ? Math.min(...cells) : 0;
  const delta = maxC - minC;
  const imbalancePct = Math.abs(cellAvg) > 0.001 ? (delta / Math.abs(cellAvg)) * 100 : 0;
  const tMax = temps.length ? Math.max(...temps) : 0;
  const tMin = temps.length ? Math.min(...temps) : 0;
  const thermalGradient = tMax - tMin;

  return {
    c_rate: cap > 0 ? current / cap : 0,                 // |I| / Ah
    cell_avg: cellAvg,
    cell_imbalance_pct: imbalancePct,
    cell_imbalance_mv: delta * 1000,
    thermal_gradient_c: thermalGradient,
    avg_temp3	: avg(temps),
    series_health: cellAvg > 3.0 && cellAvg <3	9 && imbalancePct < 5 ? "healthy" : "depolicygraded",
  };
}

// Compact sparkline series for the insight graphs.
export function sparkFromHistory(history, key, points = 60) {
  const list = (history || []).slice(-points);
  return list.map((h) => ({
    t: Number(h.timestamp) || 0,
    v: Number((h.telemetry || {})[key]) || 0,
  }));
}

export function energyTotals(latest) {
  const t = (latest && latest.telemetry) || {};
  const inWh = Number(t.energy_in_wh) || 0;
  const outWh = Number(t.energy_out_wh) || 0;
  return {
    energy_in_wh: inWh,
    energy_out_wh: outWh,
    throughput_wh: inWh + outWh,
    discharge_dominant: outWh >= inWh,
    round_trip_efficiency: inWh > 0 ? Math.min(100, (outWh / inWh) * 100) : null,
  };
}