export async function getAIPrediction(batteryData) {
  const response = await fetch(
    "https://cellguard-ai.onrender.com/predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temperature: batteryData.temperature,
        voltage: batteryData.voltage,
        current: batteryData.current,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch AI prediction");
  }

  return await response.json();
}