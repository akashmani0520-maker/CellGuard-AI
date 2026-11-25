// -----------------------------------------------------------------------
// DeepSeek client (OpenAI-compatible chat completions, streaming + function
// calling). Supports deepseek-chat (V3), deepseek-reasoner (R1), deepseek-flash,
// and deepseek-v4-pro models.
// -----------------------------------------------------------------------

export const DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions";

export const AVAILABLE_MODELS = [
  {
    id: "deepseek-chat",
    name: "deepseek-chat (DeepSeek-V3)",
    desc: "Fast, versatile, full tool-calling & function execution (Recommended)",
    supportsTools: true,
  },
  {
    id: "deepseek-reasoner",
    name: "deepseek-reasoner (DeepSeek-R1)",
    desc: "Advanced chain-of-thought mathematical and battery reasoning",
    supportsTools: false,
  },
  {
    id: "deepseek-flash",
    name: "deepseek-flash (DeepSeek-V4.1 Flash)",
    desc: "High throughput, 1M token context window, tool-calling support",
    supportsTools: true,
  },
  {
    id: "deepseek-v4-pro",
    name: "deepseek-v4-pro (DeepSeek-V4 Pro)",
    desc: "Flagship deep reasoning and complex diagnostic model",
    supportsTools: true,
  },
];

export const DEFAULT_MODEL = "deepseek-chat";

const KEY_SESSION = "cellguard.deepseek.key";
const MODEL_SESSION = "cellguard.deepseek.model";
const PROMPT_SESSION = "cellguard.deepseek.prompt";

/**
 * Sanitizes an API key string:
 * - Trims leading/trailing whitespace and newlines
 * - Strips accidental 'Bearer ' or 'Authorization: ' prefixes
 * - Removes enclosing quotes
 */
export function sanitizeKey(k) {
  if (!k) return "";
  let key = String(k).trim();
  if (key.toLowerCase().startsWith("authorization:")) {
    key = key.slice(14).trim();
  }
  if (key.toLowerCase().startsWith("bearer ")) {
    key = key.slice(7).trim();
  }
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

function storageGet(key) {
  try {
    const val = window.sessionStorage.getItem(key);
    if (val) return val;
  } catch {}
  try {
    const val = window.localStorage.getItem(key);
    if (val) return val;
  } catch {}
  return null;
}

function storageSet(key, val) {
  try {
    if (val) {
      window.sessionStorage.setItem(key, val);
      window.localStorage.setItem(key, val);
    } else {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    }
  } catch {}
}

export function getApiKey() {
  const stored = storageGet(KEY_SESSION);
  if (stored) return sanitizeKey(stored);
  try {
    const envKey = import.meta.env?.VITE_DEEPSEEK_API_KEY;
    if (envKey) return sanitizeKey(envKey);
  } catch {}
  return "";
}

export function setApiKey(key) {
  const clean = sanitizeKey(key);
  storageSet(KEY_SESSION, clean);
}

export function clearApiKey() {
  storageSet(KEY_SESSION, "");
}

export function hasApiKey() {
  return Boolean(getApiKey());
}

export function getModel() {
  return storageGet(MODEL_SESSION) || DEFAULT_MODEL;
}

export function setModel(m) {
  storageSet(MODEL_SESSION, m ? m.trim() : DEFAULT_MODEL);
}

export function getSystemPrompt() {
  return storageGet(PROMPT_SESSION) || DEFAULT_SYSTEM_PROMPT;
}

export function setSystemPrompt(p) {
  storageSet(PROMPT_SESSION, p ? p.trim() : "");
}

export function resetSystemPrompt() {
  storageSet(PROMPT_SESSION, DEFAULT_SYSTEM_PROMPT);
}

function authHeaders(apiKeyOverride) {
  const key = sanitizeKey(apiKeyOverride) || getApiKey();
  if (!key) throw new Error("DeepSeek API key is not set. Add one in Settings > AI Assistant.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

export const DEFAULT_SYSTEM_PROMPT = `You are CellGuard Copilot, an expert battery-management assistant
embedded in a live BMS dashboard. You help operators understand battery state,
faults, history and energy data, and you can take simple control actions.

You have real tools (function calling) that read LIVE telemetry from the ESP32
BMS node and send commands over AWS IoT. Prefer the tools over guessing.
- use get_latest_telemetry / get_battery_status for current readings
- use get_telemetry_history to analyse trends
- use decode_faults to explain fault masks
- use get_energy_report for lifecycle / coulomb data
- ONLY call send_command (load_relay / charger_relay / clear_faults) when the
  operator EXPLICITLY asks to toggle a relay or clear faults. Never do it on
  your own. A negative/zero pack voltage and negative cell voltages usually
  indicate the sensor is turned around or a cell/temp sensor fault.
Be concise, practical and safety-first.

FORMATTING RULES:
- Use GitHub-flavoured Markdown for structure (headings, bullet lists, tables).
- Use LaTeX between $...$ for inline math and $$...$$ for display math when it
  helps, e.g. V = sum of cells, or a display equation for cell delta.
- Wrap code/commands in backticks. Never wrap the whole answer in a code fence.
- Keep answers short and skimmable.`;

// Non-streaming call (Settings connection test + report generation).
export async function callChatCompletion({ messages, tools, toolChoice, model, apiKey }) {
  const selectedModel = model || getModel();
  const body = {
    model: selectedModel,
    messages,
    temperature: selectedModel === "deepseek-reasoner" ? undefined : 0.3,
    max_tokens: 2048,
    stream: false,
  };
  // deepseek-reasoner does not support tools/function calling
  if (tools && tools.length && selectedModel !== "deepseek-reasoner") {
    body.tools = tools;
    body.tool_choice = toolChoice || "auto";
  }

  const res = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.error?.message || e?.message || JSON.stringify(e);
    } catch {
      detail = res.statusText;
    }
    throw new Error(`DeepSeek error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

// Streaming call: yields token deltas via onDelta; returns the assembled
// assistant message (content + tool_calls) and token usage.
export async function callChatCompletionStream({ messages, tools, signal, onDelta, model, apiKey }) {
  const selectedModel = model || getModel();
  const body = {
    model: selectedModel,
    messages,
    temperature: selectedModel === "deepseek-reasoner" ? undefined : 0.3,
    max_tokens: 2048,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (tools && tools.length && selectedModel !== "deepseek-reasoner") {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.error?.message || e?.message || JSON.stringify(e);
    } catch {
      detail = res.statusText;
    }
    throw new Error(`DeepSeek error ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let message = { role: "assistant", content: "", tool_calls: [] };
  let usage = null;
  let finishReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";

    for (const raw of parts) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }

      if (json.usage) usage = json.usage;
      const choice = json.choices && json.choices[0];
      if (!choice) continue;
      if (choice.finish_reason) finishReason = choice.finish_reason;
      const delta = choice.delta;
      if (!delta) continue;

      if (delta.role) message.role = delta.role;
      if (typeof delta.content === "string" && delta.content.length) {
        message.content += delta.content;
        if (onDelta) onDelta(delta.content);
      }
      if (Array.isArray(delta.tool_calls)) {
        message.tool_calls = message.tool_calls || [];
        delta.tool_calls.forEach((tc, i) => {
          const idx = typeof tc.index === "number" ? tc.index : i;
          if (!message.tool_calls[idx]) {
            message.tool_calls[idx] = { id: "", type: "function", function: { name: "", arguments: "" } };
          }
          const slot = message.tool_calls[idx];
          if (tc.id) slot.id = tc.id;
          if (tc.function) {
            if (tc.function.name) slot.function.name = tc.function.name;
            if (tc.function.arguments) slot.function.arguments += tc.function.arguments;
          }
        });
      }
    }
  }

  message.tool_calls = (message.tool_calls || []).filter(Boolean);
  if (finishReason) message.finish_reason = finishReason;
  return { message, usage };
}

// Tool-calling loop with streaming. Executes any tool the model requests via
// executeTool, feeds results back, and repeats until the model answers.
export async function runAssistantToolLoop(
  initialMessages,
  tools,
  executeTool,
  { maxRounds = 6, onDelta, signal } = {}
) {
  let history = initialMessages.slice();
  const toolLog = [];
  let totalUsage = null;

  for (let round = 0; round < maxRounds; round++) {
    const { message, usage } = await callChatCompletionStream({ messages: history, tools, signal, onDelta });
    if (usage) {
      totalUsage = {
        prompt_tokens: (totalUsage?.prompt_tokens || 0) + (usage.prompt_tokens || 0),
        completion_tokens: (totalUsage?.completion_tokens || 0) + (usage.completion_tokens || 0),
        total_tokens: (totalUsage?.total_tokens || 0) + (usage.total_tokens || 0),
      };
    }

    history = history.concat([message]);

    const calls = message.tool_calls || [];
    if (!calls.length) {
      return { content: message.content || "Done.", toolLog, usage: totalUsage, history };
    }

    for (const call of calls) {
      const name = call?.function?.name || "";
      let args = {};
      try {
        args = JSON.parse(call?.function?.arguments || "{}");
      } catch {
        args = {};
      }
      let result;
      try {
        result = await executeTool(name, args);
      } catch (e) {
        result = { error: String(e?.message || e) };
      }
      toolLog.push({ name, args, result });
      history = history.concat([
        { role: "tool", tool_call_id: call.id, content: JSON.stringify(result) },
      ]);
    }
  }

  throw new Error("Assistant hit the maximum tool-call rounds without a final answer.");
}
