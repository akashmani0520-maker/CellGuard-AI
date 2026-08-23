const API_URL = "https://tj9rsj7k76.execute-api.us-east-1.amazonaws.com/bms";

function mapTelemetryToUI(data) {
  if (!data || !data.telemetry) return null;
  
  const temps = data.telemetry.temperature || [0];
  const maxTemp = Math.max(...temps);
  
  let fireRisk = 5;
  if (maxTemp > 35) fireRisk += 20;
  if (maxTemp > 45) fireRisk += 30;
  if (!data.analysis?.is_safe) fireRisk = Math.max(fireRisk, 80);

  return {
    batteryHealth: data.telemetry.soc || 0,
    temperature: maxTemp,
    voltage: data.telemetry.pack_voltage || 0,
    current: data.telemetry.pack_current || 0,
    fireRisk: fireRisk,
    systemStatus: data.analysis?.is_safe ? "SAFE" : "CRITICAL",
    timestamp: data.timestamp,
    raw: data
  };
}

export async function fetchLatestTelemetry(deviceId = "NANO_ESP_BMS_NODE_01") {
  const response = await fetch(`${API_URL}?enquiry=latest&device_id=${deviceId}`);
  if (!response.ok) throw new Error("Failed to fetch latest telemetry");
  const data = await response.json();
  return mapTelemetryToUI(data);
}

export async function fetchBatteryHistory(deviceId = "NANO_ESP_BMS_NODE_01", start = 0, end = 2147483647000) {
  const response = await fetch(`${API_URL}?enquiry=history&device_id=${deviceId}&start=${start}&end=${end}`);
  if (!response.ok) throw new Error("Failed to fetch history");
  const data = await response.json();
  return data.map(item => mapTelemetryToUI(item)).filter(item => item !== null);
}

export async function sendCommand(deviceId = "NANO_ESP_BMS_NODE_01", command, state = 0) {
  const response = await fetch(API_URL, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_id: deviceId,
      command,
      state
    })
  });
  if (!response.ok) throw new Error("Failed to send command");
  const data = await response.json();
  return data;
}
