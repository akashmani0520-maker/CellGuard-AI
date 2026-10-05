// -----------------------------------------------------------------------
// DeepSeek client (OpenAI-compatible chat completions, streaming + function
// calling). The API key lives ONLY in sessionStorage -> cleared on tab close.
// -----------------------------------------------------------------------

export const DEEPSEEK_CHAT_ENDPOINT = "https://api.deepseek.com/chat/completions";
export const DEFAULT_MODEL = "deepseek-chat";

const KEY_SESSION = "cellguard.deepseek.key";
const MODEL_SESSION = "cellguard.deepseek.model";
const PROMPT_SESSION = "cellguard.deepseek.prompt";

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

function sessionGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function sessionSet(key, val) {
  try {
    if (val) window.sessionStorage.setItem(key, val);
    else window.sessionStorage.removeItem(key);
  } catch {}
}

export function getApiKey() {
  return sessionGet(KEY_SESSION) || "";
}
export function setApiKey(key) {
  sessionSet(KEY_SESSION, key ? key.trim() : "");
}
export function clearApiKey() {
  sessionSet(KEY_SESSION, "");
}
export function hasApiKey() {
  return Boolean(getApiKey());
}
export function getModel() {
  return sessionGet(MODEL_SESSION) || DEFAULT_MODEL;
}
export function setModel(m) {
  sessionSet(MODEL_SESSION, m ? m.trim() : "");
}
export function getSystemPrompt() {
  return sessionGet(PROMPT_SESSION) || DEFAULT_SYSTEM_PROMPT;
}
export function setSystemPrompt(p) {
  sessionSet(PROMPT_SESSION, p ? p.trim() : "");
}
export function resetSystemPrompt() {
  sessionSet(PROMPT_SESSION, DEFAULT_SYSTEM_PROMPT);
}

function authHeaders() {
  const key = getApiKey();
  if (!key) throw new Error("DeepSeek API key is not set. Add one in Settings > AI Assistant.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
}

// Non-streaming call (Settings connection test + report generation).
export async function callChatCompletion({ messages, tools, toolChoice }) {
  const body = { model: getModel(), messages, temperature: 0.3, max_tokens: 2048, stream: false };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = toolChoice || "auto";
  }
  const res = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.error?.message || JSON.stringify(e);
    } catch {}
    throw new Error(`DeepSeek error ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

// Streaming call: yields token deltas via onDelta; returns the assembled
// assistant message (content + tool_calls) and token usage.
export async function callChatCompletionStream({ messages, tools, signal, onDelta }) {
  const body = {
    model: getModel(),
    messages,
    temperature: 0.3,
    max_tokens: 2048,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(DEEPSEEK_CHAT_ENDPOINT, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      const e = await res.json();
      detail = e?.error?.message || JSON.stringify(e);
    } catch {}
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
