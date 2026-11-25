// CellGuard AI — Advanced 3S Battery Physics & Viva Simulation Engine
// Accurately models a 3S (3-Series) Lithium-ion NMC battery pack:
// - Nominal Voltage: 11.10 V (3 x 3.70 V)
// - Max Charge Voltage: 12.60 V (3 x 4.20 V)
// - Discharge Cutoff: 9.00 V (3 x 3.00 V, Emergency trip at 8.55 V)
// - Nominal Capacity: 5.2 Ah (5200 mAh)
// - Realistic non-linear Li-ion OCV-SoC curve
// - Instantaneous IR voltage sag under load: V_terminal = V_ocv - I * R_int
// - Joule heating & thermal dissipation across 3 sensors (Core, FETs/Shunt, Ambient)
// - Minor realistic ADC sensor noise / micro-fluctuations (+/- 0.15°C, +/- 2 mV)
// - Dynamic SoC consumption over time proportional to load
// - 12 rich Viva / demonstration scenarios tailored for college examiners

export const CELL_COUNT = 3;
export const CELL_NOMINAL = 3.7;
export const PACK_NOMINAL = 11.1;
export const PACK_MAX = 12.6;
export const PACK_MIN = 9.0;
export const NOMINAL_CAPACITY_AH = 5.2;

// Standard Load Presets for 3S Pack
export const LOAD_PRESETS = {
  idle: {
    id: "idle",
    label: "Standby / Idle",
    current: 0.08,
    desc: "BMS MCU, ESP32 Wi-Fi & quiescent telemetry draw (~0.9 W)",
    color: "#94a3b8",
  },
  light: {
    id: "light",
    label: "Light Load (IoT Sensors)",
    current: 0.65,
    desc: "Microcontrollers, radio uplink, GPS & status displays (~7.2 W)",
    color: "#38bdf8",
  },
  medium: {
    id: "medium",
    label: "Medium Load (Actuators)",
    current: 2.50,
    desc: "LED lighting, companion computer, cooling fans (~27 W)",
    color: "#34d399",
  },
  motor: {
    id: "motor",
    label: "DC Motor / Drive Nominal",
    current: 5.50,
    desc: "Brushless drive motor running at standard cruising load (~58 W)",
    color: "#f59e0b",
  },
  heavy: {
    id: "heavy",
    label: "Heavy Load / Acceleration",
    current: 9.00,
    desc: "Full acceleration or steep gradient climb, pronounced IR voltage sag (~95 W)",
    color: "#f97316",
  },
  peak: {
    id: "peak",
    label: "Peak Surge / Inverter",
    current: 13.50,
    desc: "High-power surge near continuous limit, rapid thermal rise (~135 W)",
    color: "#ef4444",
  },
  charge_trickle: {
    id: "charge_trickle",
    label: "Trickle / Float Charge",
    current: -0.80,
    desc: "Low-current balancing and float charge near 100% SoC (~9 W)",
    color: "#818cf8",
  },
  charge_fast: {
    id: "charge_fast",
    label: "CC Fast Charge (1C)",
    current: -3.50,
    desc: "Constant-current bulk charging into 3S pack (~42 W)",
    color: "#a855f7",
  },
};

// 12 College Viva Scenarios
export const SCENARIOS = {
  nominal: {
    id: "nominal",
    label: "3S Nominal Cruise",
    desc: "Balanced 3S pack at 75% SoC (~11.3V), 2.2A motor load, cell delta < 15mV, temperatures stable at 28°C.",
    color: "#10b981",
    category: "Normal",
  },
  load_step: {
    id: "load_step",
    label: "Dynamic Load Step (Motor Start)",
    desc: "Sudden transition from 0.5A idle to 7.5A heavy load, demonstrating real-time IR voltage sag and recovery.",
    color: "#06b6d4",
    category: "Dynamics",
  },
  charging_cc: {
    id: "charging_cc",
    label: "Constant-Current (CC) Fast Charging",
    desc: "3.5A bulk charging into pack, SoC climbing, cell voltages rising from 3.75V towards 4.10V.",
    color: "#3b82f6",
    category: "Charging",
  },
  charging_cv: {
    id: "charging_cv",
    label: "Constant-Voltage (CV) Float & Balancing",
    desc: "Pack at 12.45V (4.15V/cell), current tapering down to 0.35A, passive balancing shunts active.",
    color: "#6366f1",
    category: "Charging",
  },
  cell_imbalance: {
    id: "cell_imbalance",
    label: "Severe Cell Imbalance (Degraded Cell 2)",
    desc: "Cell 2 has higher internal resistance; under load it sags to 3.25V while Cells 1 & 3 stay at 3.65V (Delta > 350 mV).",
    color: "#f59e0b",
    category: "Faults",
  },
  thermal_warning: {
    id: "thermal_warning",
    label: "MOSFET High-Temperature Alert",
    desc: "Sustained high load heats Sensor 2 (FETs/Shunt) to 48.5°C (> 45°C threshold), triggering cooling/throttle warning.",
    color: "#f97316",
    category: "Thermal",
  },
  thermal_cutoff: {
    id: "thermal_cutoff",
    label: "Thermal Runaway Protection Trip (58°C)",
    desc: "Sensor 2 reaches 58°C (> 55°C critical). BMS trips FAULT_DISCHARGE_OT, opens load relay, halts current to prevent fire.",
    color: "#ef4444",
    category: "Protection",
  },
  low_soc_warning: {
    id: "low_soc_warning",
    label: "Low Battery Reserve (<15% SoC)",
    desc: "Pack SoC at 12%, pack voltage 9.8V (3.27V/cell), low SoC alert active, prompts operator to connect charger.",
    color: "#eab308",
    category: "Normal",
  },
  undervoltage_trip: {
    id: "undervoltage_trip",
    label: "Over-Discharge Cutoff Trip (2.85V)",
    desc: "Cell 3 dips to 2.85V cutoff threshold during high load, BMS trips FAULT_CELL_UV & FAULT_PACK_UV, opens load relay.",
    color: "#dc2626",
    category: "Protection",
  },
  overvoltage_trip: {
    id: "overvoltage_trip",
    label: "Over-Charge Cutoff Trip (4.28V)",
    desc: "Faulty charger pushes Cell 1 to 4.28V (> 4.25V safety limit). BMS instantly trips FAULT_CELL_OV, opening charger relay.",
    color: "#b91c1c",
    category: "Protection",
  },
  overcurrent_short: {
    id: "overcurrent_short",
    label: "Short-Circuit / Heavy Over-Current",
    desc: "16A short-circuit current spike, BMS trips FAULT_DISCHARGE_OC and FAULT_SHORT within microseconds, locks out relays.",
    color: "#991b1b",
    category: "Protection",
  },
  ground_mux_fix: {
    id: "ground_mux_fix",
    label: "Dual-MUX Ground-Reference Demo",
    desc: "Demonstrates hardware innovation: Ground MUX cycling references (GND, -V1, -(V1+V2)) for true differential 3S ADC reads.",
    color: "#8b5cf6",
    category: "Hardware",
  },
};

// Helper: clamp number between limits
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Helper: subtle realistic Gaussian noise
export const jitter = (base, sigma = 0.005) => base + (Math.random() - 0.5) * 2 * sigma;

/**
 * Li-ion NMC Open-Circuit Voltage (OCV) as a function of State of Charge (SoC).
 * Based on empirical 18650 NMC discharge curve.
 * @param {number} socPercent (0 to 100)
 * @returns {number} Open-circuit voltage per cell in Volts (3.00 V to 4.20 V)
 */
export function getCellOCV(socPercent) {
  const s = clamp(socPercent, 0, 100);
  if (s >= 98) return 4.18 + (s - 98) * 0.01;      // 4.18V - 4.20V (Top end charge)
  if (s >= 85) return 4.05 + (s - 85) * (0.13 / 13); // 4.05V - 4.18V
  if (s >= 40) return 3.72 + (s - 40) * (0.33 / 45); // 3.72V - 4.05V (Stable plateau)
  if (s >= 15) return 3.48 + (s - 15) * (0.24 / 25); // 3.48V - 3.72V
  if (s >= 5)  return 3.20 + (s - 5)  * (0.28 / 10); // 3.20V - 3.48V (Discharge knee)
  return 3.00 + (s / 5) * 0.20;                      // 3.00V - 3.20V (Deep cutoff)
}

/**
 * Generate a complete, physics-grounded telemetry snapshot for 3S battery.
 * @param {string} scenarioId
 * @param {number} tick - monotonic counter (advances time)
 * @param {object} overrides - user adjustments (soc, pack_voltage, pack_current, temperature, loadPreset)
 * @returns {{ deviceId, timestamp, telemetry, analysis }}
 */
export function generateSnapshot(scenarioId = "nominal", tick = 0, overrides = {}) {
  const now = Date.now();
  const phase = (tick % 120) / 120; // 0..1 cyclic progression
  const simSeconds = tick * 1.5;     // elapsed virtual seconds

  // Ambient baseline
  const AMBIENT_TEMP = 26.5;

  // Internal resistance per cell in Ohms
  let rCell = [0.028, 0.032, 0.030]; // ~90 mOhm total pack ESR

  // State variables default to nominal 3S
  let baseSoc = 75.0;
  let loadAmps = 2.20; // Positive = discharging to load, Negative = charging
  let bmsOnline = true;
  let loadRelay = true;
  let chargerRelay = false;
  let loadDetected = true;
  let chargerDetected = false;
  let charging = false;
  let faultFlags = 0;
  let faultCount = 0;
  let isSafe = true;
  let anomalies = [];
  let cycleCount = 42;
  let sohPercent = 95.5;

  // Temperature rise factors
  let thermalMultiplier = 1.0;
  let extraTempFET = 0.0;
  let extraTempCell = 0.0;

  // Cell balance offset in Volts
  let cellOffset = [0.0, 0.0, 0.0];

  switch (scenarioId) {
    case "load_step": {
      // Periodic step load: 0.5A idle for 60 ticks, 7.5A high load for 60 ticks
      const isHighLoad = (tick % 60) >= 30;
      loadAmps = isHighLoad ? 7.50 : 0.60;
      baseSoc = clamp(70.0 - (simSeconds * 0.05), 5, 100);
      thermalMultiplier = isHighLoad ? 2.5 : 1.0;
      extraTempFET = isHighLoad ? 8.5 : 1.2;
      anomalies = isHighLoad ? ["Transient load step: 7.5A active", "IR voltage sag ~0.65V"] : [];
      break;
    }

    case "charging_cc": {
      loadAmps = -3.50; // CC fast charge (current INTO pack)
      baseSoc = clamp(45.0 + (simSeconds * 0.08), 0, 95);
      charging = true;
      chargerDetected = true;
      chargerRelay = true;
      loadRelay = false;
      loadDetected = false;
      thermalMultiplier = 1.6;
      extraTempFET = 4.0;
      anomalies = ["Fast Charge active (3.5A CC Mode)"];
      break;
    }

    case "charging_cv": {
      // In CV mode, current gradually tapers down as cell approaches 4.2V
      const taper = Math.max(0.20, 1.80 - phase * 1.50);
      loadAmps = -taper;
      baseSoc = clamp(94.0 + phase * 5.0, 90, 99.5);
      charging = true;
      chargerDetected = true;
      chargerRelay = true;
      loadRelay = false;
      loadDetected = false;
      // Slight cell balancing shunt active on cell 2
      cellOffset = [0.002, -0.005, 0.003];
      anomalies = ["Constant-Voltage (CV) Float Phase", "Passive cell balancing shunt active"];
      break;
    }

    case "cell_imbalance": {
      loadAmps = 4.80;
      baseSoc = 62.0;
      // Cell 2 has significantly degraded ESR and lower capacity
      rCell[1] = 0.088; // 88 mOhm ESR!
      cellOffset = [0.015, -0.320, 0.010]; // 320 mV deficit on cell 2
      extraTempCell = 4.5;
      isSafe = false;
      anomalies = [
        "Cell 2 severe capacity & ESR degradation",
        "Cell voltage delta > 300 mV (Balancing required)",
        "Degraded cell thermal rise detected",
      ];
      break;
    }

    case "thermal_warning": {
      loadAmps = 9.80; // heavy sustained load
      baseSoc = clamp(58.0 - phase * 6.0, 10, 100);
      thermalMultiplier = 3.8;
      extraTempFET = 21.5 + phase * 3.0; // Pushes FET sensor to ~49°C
      extraTempCell = 9.0;
      isSafe = false;
      anomalies = [
        "Thermal Warning: MOSFET temperature exceeds 45°C threshold",
        "Active cooling fan engaged",
        "High continuous discharge dissipation",
      ];
      break;
    }

    case "thermal_cutoff": {
      // Runaway / overheat protection trip
      loadAmps = 0.0; // Current cut off by BMS relay!
      baseSoc = 42.0;
      loadRelay = false;   // Relay OPEN
      chargerRelay = false;
      faultFlags = 0x0100; // FAULT_DISCHARGE_OT (bit 8 = 256)
      faultCount = 1;
      extraTempFET = 31.0; // 58°C!
      extraTempCell = 16.0;
      isSafe = false;
      anomalies = [
        "CRITICAL: Thermal Runaway Protection Tripped",
        "FAULT_DISCHARGE_OT (58.2°C > 55°C Limit)",
        "Discharge relay opened to isolate load",
      ];
      break;
    }

    case "low_soc_warning": {
      loadAmps = 1.40;
      baseSoc = clamp(11.5 - phase * 3.0, 6.0, 15.0);
      isSafe = false;
      anomalies = [
        "Low State of Charge: Reserve capacity < 15%",
        "Min cell voltage approaching 3.25V threshold",
        "Connect charger to prevent over-discharge",
      ];
      break;
    }

    case "undervoltage_trip": {
      loadAmps = 0.0; // Current cut by relay
      baseSoc = 2.5;
      loadRelay = false;   // Relay opened
      chargerRelay = false;
      faultFlags = 0x000A; // FAULT_CELL_UV (bit 1) | FAULT_PACK_UV (bit 3)
      faultCount = 2;
      cellOffset = [-0.10, -0.15, -0.35]; // Cell 3 at 2.85V cutoff
      isSafe = false;
      anomalies = [
        "CRITICAL: Over-Discharge Protection Tripped",
        "FAULT_CELL_UV: Cell 3 dipped below 2.90V cutoff",
        "Relay opened to prevent permanent copper dissolution",
      ];
      break;
    }

    case "overvoltage_trip": {
      loadAmps = 0.0; // Charger cut off by BMS
      baseSoc = 100.0;
      charging = false;
      chargerDetected = true;
      chargerRelay = false; // Tripped open
      loadRelay = false;
      faultFlags = 0x0005;  // FAULT_CELL_OV (bit 0) | FAULT_PACK_OV (bit 2)
      faultCount = 1;
      cellOffset = [0.18, 0.02, 0.03]; // Cell 1 at 4.28V!
      isSafe = false;
      anomalies = [
        "CRITICAL: Over-Charge Protection Tripped",
        "FAULT_CELL_OV: Cell 1 exceeded 4.25V cutoff (4.28V)",
        "Charge relay opened to prevent thermal runaway",
      ];
      break;
    }

    case "overcurrent_short": {
      loadAmps = 0.0; // Fast electronic trip
      baseSoc = 68.0;
      loadRelay = false; // Tripped
      chargerRelay = false;
      faultFlags = 0x0060; // FAULT_DISCHARGE_OC (bit 5) | FAULT_SHORT (bit 6)
      faultCount = 4;
      isSafe = false;
      anomalies = [
        "CRITICAL: Short Circuit / High Over-Current Tripped",
        "Hardware comparator tripped in < 25 microseconds",
        "Relays locked open until manual fault clear",
      ];
      break;
    }

    case "ground_mux_fix": {
      loadAmps = 2.10;
      baseSoc = 72.0;
      // Highlighting the hardware ground-switch solution
      anomalies = [
        "Dual-MUX Differential Read Active: Primary + Ground MUX synced",
        "ADC Reference shifted to 0V, -V1, -(V1+V2) sequentially",
        "Eliminates negative rail ADC limitations with 100% positive voltages",
      ];
      break;
    }

    case "nominal":
    default: {
      loadAmps = 2.20;
      // Normal minor SoC decrease over session
      baseSoc = clamp(76.0 - (simSeconds * 0.015), 10, 100);
      anomalies = [];
      break;
    }
  }

  // Handle Load Preset override if selected in Demo Console
  if (overrides.loadPreset && LOAD_PRESETS[overrides.loadPreset]) {
    const preset = LOAD_PRESETS[overrides.loadPreset];
    loadAmps = preset.current;
    if (loadAmps < 0) {
      charging = true;
      chargerDetected = true;
      chargerRelay = true;
      loadRelay = false;
      loadDetected = false;
    } else {
      charging = false;
      chargerDetected = false;
      chargerRelay = false;
      loadRelay = true;
      loadDetected = loadAmps > 0.05;
    }
  }

  // Handle manual parameter overrides from sliders
  if (overrides.soc !== undefined && overrides.soc !== null) baseSoc = Number(overrides.soc);
  if (overrides.pack_current !== undefined && overrides.pack_current !== null) {
    loadAmps = Number(overrides.pack_current);
  }

  // Clamp SoC to physical limits
  const soc = clamp(baseSoc, 0, 100);

  // --- Compute 3S Cell Voltages with Li-ion OCV + IR Sag + micro-noise ---
  // Li-ion terminal voltage = OCV - (I_load * R_int)
  // For charging (negative loadAmps): terminal voltage rises above OCV
  const ocvBase = getCellOCV(soc);

  const cellVoltages = [0, 1, 2].map((i) => {
    const ocv = ocvBase + cellOffset[i];
    const irDrop = loadAmps * rCell[i]; // IR sag in Volts
    const v = ocv - irDrop;
    // Add micro-noise (+/- 1.5 mV)
    return clamp(jitter(v, 0.0015), 2.50, 4.35);
  });

  // Pack voltage is the sum of the 3 series cells
  let packVoltage = cellVoltages.reduce((sum, v) => sum + v, 0);
  if (overrides.pack_voltage !== undefined && overrides.pack_voltage !== null) {
    packVoltage = Number(overrides.pack_voltage);
  }

  // Electrical Power = V * |I| (Always positive magnitude in Watts)
  const currentMagnitude = Math.abs(loadAmps);
  const packPower = packVoltage * currentMagnitude;

  // --- Thermal Physics Engine ---
  // Joule losses = I^2 * R_pack (W)
  const rTotalPack = rCell.reduce((a, b) => a + b, 0);
  const jouleHeatWatts = Math.pow(currentMagnitude, 2) * rTotalPack;

  // Sensor 1: Core pack temperature (slow thermal inertia)
  const tCore = AMBIENT_TEMP + (jouleHeatWatts * 0.45 * thermalMultiplier) + extraTempCell;
  // Sensor 2: Power MOSFETs & Shunt resistor (heats up quickest under load)
  const tMosfet = AMBIENT_TEMP + (jouleHeatWatts * 1.10 * thermalMultiplier) + extraTempFET;
  // Sensor 3: Pack casing / ambient reference
  const tAmbient = AMBIENT_TEMP + (jouleHeatWatts * 0.20 * thermalMultiplier) + 0.5;

  // Realistic micro-fluctuations on temperature (+/- 0.12°C)
  let temps = [
    jitter(tCore, 0.10),
    jitter(tMosfet, 0.15),
    jitter(tAmbient, 0.08),
  ].map((t) => clamp(t, -10, 85));

  if (overrides.temperature !== undefined && Array.isArray(overrides.temperature)) {
    temps = overrides.temperature;
  }

  const minCell = Math.min(...cellVoltages);
  const maxCell = Math.max(...cellVoltages);
  const cellDelta = maxCell - minCell;

  const remainingAh = clamp((soc / 100) * NOMINAL_CAPACITY_AH, 0, NOMINAL_CAPACITY_AH);

  // Return clean, positive telemetry payload (no negative values)
  const telemetry = {
    pack_voltage: Number(packVoltage.toFixed(3)),
    pack_current: Number(currentMagnitude.toFixed(3)), // Clean positive magnitude
    pack_power: Number(packPower.toFixed(2)),           // Clean positive Watts
    soc: Number(soc.toFixed(1)),
    cell_voltage: cellVoltages.map((v) => Number(v.toFixed(3))),
    temperature: temps.map((t) => Number(t.toFixed(1))),
    cell_delta: Number(cellDelta.toFixed(3)),
    min_cell_voltage: Number(minCell.toFixed(3)),
    max_cell_voltage: Number(maxCell.toFixed(3)),
    drift: Number(cellDelta.toFixed(3)),
    bms_online: bmsOnline,
    wifi_online: true,
    aws_online: true,
    load_detected: loadDetected,
    charger_detected: chargerDetected,
    charger_relay: chargerRelay,
    load_relay: loadRelay,
    charging,
    fault_flags: faultFlags,
    fault_count: faultCount,
    last_fault_flags: faultFlags,
    last_fault_epoch: faultFlags ? now - 45000 : 0,
    rssi: -58,
    uptime_ms: 3600000 + tick * 1500,
    cycle_count: cycleCount,
    soh_percent: sohPercent,
    full_capacity_ah: NOMINAL_CAPACITY_AH,
    remaining_capacity: Number(remainingAh.toFixed(2)),
    amp_hours_in: Number((8.4 + (charging ? (currentMagnitude * tick * 0.0004) : 0)).toFixed(2)),
    amp_hours_out: Number((14.2 + (!charging ? (currentMagnitude * tick * 0.0004) : 0)).toFixed(2)),
    energy_in_wh: Number((95.0 + (charging ? (packPower * tick * 0.0004) : 0)).toFixed(1)),
    energy_out_wh: Number((162.0 + (!charging ? (packPower * tick * 0.0004) : 0)).toFixed(1)),
    node_id: "MOCK_NODE",
    // 3S Pack Architecture metadata for UI & Viva
    pack_config: "3S1P",
    cell_count: 3,
    nominal_voltage: PACK_NOMINAL,
  };

  return {
    deviceId: "MOCK_DEMO_DEVICE",
    timestamp: String(now),
    telemetry,
    analysis: {
      is_safe: isSafe,
      anomalies,
    },
  };
}

/**
 * Generate a backfill of historical telemetry points for charts.
 * @param {string} scenarioId
 * @param {number} points  number of history entries
 * @param {object} overrides
 * @returns {Array<{ deviceId, timestamp, telemetry, analysis }>}
 */
export function generateHistory(scenarioId = "nominal", points = 60, overrides = {}) {
  const now = Date.now();
  const intervalMs = 3000;
  return Array.from({ length: points }, (_, i) => {
    const snap = generateSnapshot(scenarioId, i, overrides);
    snap.timestamp = String(now - (points - i) * intervalMs);
    return snap;
  });
}
