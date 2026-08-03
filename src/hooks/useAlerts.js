import { useEffect, useState } from "react";
import { subscribeAlerts } from "../services/firebaseService";

export default function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeAlerts((data) => {
      setAlerts(Object.values(data));
    });

    return () => unsubscribe();
  }, []);

  return alerts;
}