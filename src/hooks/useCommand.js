import { useState } from "react";
import { sendCommand } from "../lib/api";

export default function useCommand(deviceId) {
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const run = async (command, state = 0) => {
    setBusy(true);
    try {
      const data = await sendCommand(deviceId, command, state);
      setLastResult({ command, state, ok: true, data, at: Date.now() });
      return data;
    } catch (err) {
      setLastResult({ command, state, ok: false, error: String(err?.message || err), at: Date.now() });
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return { busy, lastResult, run };
}
