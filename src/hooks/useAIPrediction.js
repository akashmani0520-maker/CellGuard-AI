import { useEffect, useState } from "react";

export default function useAIPrediction(batteryData) {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (!batteryData) return;

    fetch("https://cellguard-ai.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batteryData),
    })
      .then((res) => res.json())
      .then((data) => {
        setPrediction(data);
      })
      .catch((err) => {
        console.log(err);
      });

  }, [batteryData]);

  return prediction;
}