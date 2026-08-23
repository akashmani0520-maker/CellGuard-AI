import { useEffect, useState } from "react";
import { fetchLatestTelemetry } from "../services/awsService";

export default function useBatteryData() {
  const [batteryData, setBatteryData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const data = await fetchLatestTelemetry("NANO_ESP_BMS_NODE_01");
        if (isMounted && data && Object.keys(data).length > 0) {
          setBatteryData(data);
        }
      } catch (error) {
        console.error("Error fetching battery data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return batteryData;
}