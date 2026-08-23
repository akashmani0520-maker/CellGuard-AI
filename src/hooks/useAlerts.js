import { useEffect, useState } from "react";
import { fetchBatteryHistory } from "../services/awsService";

export default function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      try {
        const history = await fetchBatteryHistory("NANO_ESP_BMS_NODE_01");
        if (isMounted && history) {
          const criticalAlerts = history
            .filter(item => item.systemStatus !== "SAFE")
            .map(item => ({
              id: item.timestamp,
              time: new Date(Number(item.timestamp)).toLocaleString(),
              type: item.systemStatus,
              message: `Fire Risk: ${item.fireRisk}%, Temp: ${item.temperature}°C`,
              status: "unread"
            }))
            .slice(0, 10);
          setAlerts(criticalAlerts.reverse());
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return alerts;
}