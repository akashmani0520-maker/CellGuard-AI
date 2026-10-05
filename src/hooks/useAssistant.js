import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { runAssistantToolLoop, getSystemPrompt } from "../lib/deepseek";
import { TOOLS, executeTool } from "../lib/tools";
import { sendCommand } from "../lib/api";
import { useTelemetryCtx } from "../context/TelemetryContext";
import { useDevice } from "../context/DeviceContext";

const SESSION_CHAT = "cellguard.chat.items";

let uid = 0;
const nextId = () => `m${Date.now().toString(36)}${++uid}`;

function loadChat() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_CHAT);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveChat(items) {
  try {
    window.sessionStorage.setItem(SESSION_CHAT, JSON.stringify(items.slice(-80)));
  } catch {}
}

export default function useAssistant() {
  const { latest, history } = useTelemetryCtx();
  const { deviceId } = useDevice();

  const [items, setItems] = useState(loadChat);
  const [usage, setUsage] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const abortRef = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    saveChat(items);
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
    setUsage(null);
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const context = useMemo(
    () => ({ latest, history, deviceId, send: (d, c, s) => sendCommand(d, c, s) }),
    [latest, history, deviceId]
  );

  const send = async (text) => {
    const prompt = String(text || "").trim();
    if (!prompt || busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setItems((prev) => [...prev, { id: nextId(), role: "user", content: prompt }]);

    const prior = itemsRef.current
      .filter((it) => (it.role === "user" || it.role === "assistant") && it.content && !it.streaming)
      .map((it) => ({ role: it.role, content: it.content }));

    const messages = [
      { role: "system", content: getSystemPrompt() },
      ...prior,
      { role: "user", content: prompt },
    ];

    let streamId = null;
    const ensureStream = () => {
      if (!streamId) {
        streamId = nextId();
        setItems((prev) => [...prev, { id: streamId, role: "assistant", content: "", streaming: true }]);
      }
      return streamId;
    };

    const onDelta = (chunk) => {
      const id = ensureStream();
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, content: it.content + chunk } : it)));
    };

    const executor = async (name, args) => {
      try {
        const result = await executeTool(name, args, context);
        setItems((prev) => [...prev, { id: nextId(), role: "tool", content: `⚙ ${name}` }]);
        return result;
      } catch (e) {
        setItems((prev) => [...prev, { id: nextId(), role: "tool", content: `⚠ ${name}` }]);
        throw e;
      }
    };

    try {
      const { content, usage: u } = await runAssistantToolLoop(messages, TOOLS, executor, {
        signal: ctrl.signal,
        onDelta,
      });
      if (u) setUsage(u);
      if (streamId) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === streamId ? { ...it, content: it.content || content, streaming: false } : it
          )
        );
      } else {
        setItems((prev) => [...prev, { id: nextId(), role: "assistant", content }]);
      }
    } catch (e) {
      if (e && e.name === "AbortError") {
        setItems((prev) => prev.map((it) => (it.id === streamId ? { ...it, streaming: false } : it)));
      } else {
        setItems((prev) => [...prev, { id: nextId(), role: "error", content: String(e?.message || e) }]);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
      abortRef.current = null;
    }
  };

  return { items, usage, busy, send, stop, clear, hasContext: Boolean(latest) };
}