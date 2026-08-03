import { useEffect, useState } from "react";
import { subscribeBatteryData } from "../services/firebaseService";

export default function useBatteryData() {
  const [batteryData, setBatteryData] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeBatteryData((data) => {
      console.log("Firebase Data:", data);
      setBatteryData(data);
    });

    return () => unsubscribe();
  }, []);

  return batteryData;
}