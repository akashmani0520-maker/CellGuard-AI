import { useEffect, useState, useRef } from "react";
import { saveHistory } from "../services/firebaseService";

export default function useAIPrediction(batteryData) {

  const [prediction, setPrediction] = useState(null);

  const lastSaved = useRef("");

  useEffect(() => {

    if (!batteryData) return;

    fetch("http://127.0.0.1:5000/predict", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(batteryData),

    })

      .then((res) => res.json())

      .then((data) => {

        setPrediction(data);

        // Save only if values changed
        const key = JSON.stringify({
          batteryHealth: data.batteryHealth,
          temperature: data.temperature,
          voltage: data.voltage,
          current: data.current,
          fireRisk: data.fireRisk,
          systemStatus: data.systemStatus,
        });

        if (lastSaved.current !== key) {
          lastSaved.current = key;
          saveHistory(data);
        }

      })

      .catch((err) => {
        console.log(err);
      });

  }, [batteryData]);

  return prediction;
}