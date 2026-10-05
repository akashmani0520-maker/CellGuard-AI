// Aggregate a time-window of normalised telemetry samples into a period report.

function series(v, s = 0) {
  const arr = [];
  for (let i = 0; i < 3; i++) arr.push(s);
  (v || []).slice(0, 3).forEach((x, i) => { arr[i] = Number(x) || s; });
  return arr;
}

function minMaxAvg(arr, get, scale = 1) {
  if (!arr.length) return { min: 0, avg: 0, max: 0 };
  let min = Infinity, max = -Infinity, sum = 0, n = 0;
  arr.forEach((x) => {
    const v = Number(get(x));
    if (Number.isNaN(v)) return;
    min = Math.min(min, v); max = Math.max(max, v); sum += v; n++;
  });
  if (!n) return { min: 0, avg: 0, max: 0 };
  return { min: min * scale, avg: (sum / n) * scale, max: max * scale };
}

export function computePeriodStats(samples) {
  const list = (samples || []).filter((x) => x && x.telemetry);
  const volts = minMaxAvg(list, (x) => x.telemetry.pack_voltage);
  const current = minMaxAvg(list, (x) => x.telemetry.pack_current);
  const power = minMaxAvg(list, (x) => x.telemetry.pack_power);
  const soc = minMaxAvg(list, (x) => x.telemetry.soc);

  // temperature: per-sensor and overall peak
  const perSensor = [0, 1, 2].map((i) =>
    minMaxAvg(list, (x) => (x.telemetry.temperature || [])[i])
  );
  let overallMaxTemp = -Infinity;
  list.forEach((x) => {
    (x.telemetry.temperature || []).forEach((tmp) => { overallMaxTemp = Math.max(overallMaxTemp, Number(tmp)); });
  });
  if (overallMaxTemp === -Infinity) overallMaxTemp = 0;

  // stats across cell sensors (average of averages)
  const cellAgg = minMaxAvg(list.map((x) => {
    const c = (x.telemetry.cell_voltage || []).map(Number);
    return { avg: c.length ? c.reduce((a, b) => a + b, 0) / c.length : 0 };
  }), (x) => x.avg);

  let faultSamples = 0, safeSamples = 0;
  const faultsSeen = {};
  const anomaliesSeen = {};
  let chargeAh = 0, dischargeAh = 0, energyIn = 0, energyOut = 0;

  list.forEach((x) => {
    const t = x.telemetry;
    if ((Number(t.fault_flags) || 0) !== 0) faultSamples++;
    if (x.analysis && x.analysis.is_safe === true) safeSamples++;
    if (Number(t.amp_hours_in) > 0) chargeAh = Math.max(chargeAh, Number(t.amp_hours_in));
    if (Number(t.amp_hours_out) > 0) dischargeAh = Math.max(dischargeAh, Number(t.amp_hours_out));
    if (Number(t.energy_in_wh) > 0) energyIn = Math.max(energyIn, Number(t.energy_in_wh));
    if (Number(t.energy_out_wh) > 0) energyOut = Math.max(energyOut, Number(t.energy_out_wh));
    ((x.analysis && x.analysis.anomalies) || []).forEach((a) => { anomaliesSeen[a] = (anomaliesSeen[a] || 0) + 1; });
  });

  return {
    count: list.length,
    startTs: list.length ? list[0].timestamp : null,
    endTs: list.length ? list[list.length - 1].timestamp : null,
    packVoltage: volts,
    packCurrent: current,
    packPower: power,
    soc,
    tempsPerSensor: perSensor,
    overallMaxTemp,
    cellAvg: cellAgg,
    faultSamples,
    safeSamples,
    chargeAh,
    dischargeAh,
    energyIn,
    energyOut,
    faults: faultsSeen,
    anomalies: anomaliesSeen,
  };
}

// Cumulative counters are monotonic -> energy consumed within the window is
// the delta between the last and first sample of the period.
export function computeEnergyDeltas(samples) {
  const list = (samples || []).filter((x) => x && x.telemetry);
  if (list.length < 2) {
    return { available: false, ahIn: 0, ahOut: 0, whIn: 0, whOut: 0 };
  }
  const first = list[0].telemetry;
  const last = list[list.length - 1].telemetry;
  const d = (a, b) => Math.max(0, (Number(b) || 0) - (Number(a) || 0));
  return {
    available: true,
    ahIn: d(first.amp_hours_in, last.amp_hours_in),
    ahOut: d(first.amp_hours_out, last.amp_hours_out),
    whIn: d(first.energy_in_wh, last.energy_in_wh),
    whOut: d(first.energy_out_wh, last.energy_out_wh),
  };
}

// Build a chart-series shape compatible with the shared chart components.
export function buildPeriodSeries(samples) {
  return (samples || []).map((x) => {
    const t = x.telemetry || {};
    const ts = Number(x.timestamp) || 0;
    const temps = series(t.temperature);
    return {
      t: ts,
      label: ts ? new Date(ts).toLocaleTimeString([], { hour12: false }) : "",
      pack_voltage: Number(t.pack_voltage) || 0,
      pack_current: Number(t.pack_current) || 0,
      pack_power: Number(t.pack_power) || 0,
      soc: Number(t.soc) || 0,
      temp0: temps[0], temp1: temps[1], temp2: temps[2],
      maxTemp: Math.max(...temps),
    };
  });
}
