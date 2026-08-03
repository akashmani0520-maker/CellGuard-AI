import { ref, onValue, push } from "firebase/database";
import { database } from "../firebase/firebase";

// -------------------------
// Battery Data
// -------------------------

export const subscribeBatteryData = (callback) => {

  const batteryRef = ref(database, "battery");

  return onValue(batteryRef, (snapshot) => {

    console.log("Snapshot exists:", snapshot.exists());
    console.log("Snapshot value:", snapshot.val());

    if (snapshot.exists()) {
      callback(snapshot.val());
    }

  });

};

// -------------------------
// Alerts
// -------------------------

export const subscribeAlerts = (callback) => {

  const alertsRef = ref(database, "alerts");

  return onValue(alertsRef, (snapshot) => {

    console.log("Alerts exists:", snapshot.exists());
    console.log("Alerts data:", snapshot.val());

    if (snapshot.exists()) {
      callback(snapshot.val());
    }

  });

};

// -------------------------
// Save AI History
// -------------------------

export const saveHistory = (data) => {

  const historyRef = ref(database, "history");

  push(historyRef, {

    ...data,

    time: new Date().toLocaleString(),

  });

};