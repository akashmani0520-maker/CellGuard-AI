import { useState, useRef, useEffect } from "react";
import Markdown from "./Markdown";
import { Sparkles, Send, X, Trash2, Wrench, Copy, Check, Square, BrainCircuit } from "lucide-react";
import useAssistant from "../hooks/useAssistant";
import { hasApiKey, getModel } from "../lib/deepseek";

const QUICK = [
  "What's the current battery status?",
  "Explain any active faults",
  "Trend of pack voltage over time",
  "Show my energy report",
  "Compute the fire risk",
  "Turn on the load relay",
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
      className="text-slate-500 hover:text-slate-200 p-1 rounded"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { items, usage, busy, send, stop, clear, hasContext } = useAssistant();
  const scrollRef = useRef(null);
  const configured = hasApiKey();

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  const submit = (text) => {
    const v = String(text ?? input).trim();
    if (!v || busy || !configured) return;
    send(v);
    setInput("");
  };

  const renderItem = (it) => {
    if (it.role === "user") {
      return (
        <div key={it.id} className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-cyan-600/20 border border-cyan-500/30 px-3.5 py-2 text-sm text-slate-100 whitespace-pre-wrap">
            {it.content}
          </div>
        </div>
      );
    }
    if (it.role === "tool") {
      return (
        <div key={it.id} className="flex justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-400 font-mono">
            <Wrench className="h-3 w-3 text-cyan-300" /> {it.content}
          </span>
        </div>
      );
    }
    if (it.role === "error") {
      return (
        <div key={it.id} className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm text-rose-200 whitespace-pre-wrap">
            {it.content}
          </div>
        </div>
      );
    }
    return (
      <div key={it.id} className="flex justify-start group">
        <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-slate-800/70 border border-slate-700 px-3.5 py-2.5">
          <Markdown content={it.content || ""} />
          {it.streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-cyan-400 align-middle" />
          )}
          {!it.streaming && it.content && (
            <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyBtn text={it.content} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="CellGuard Copilot"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 shadow-lg shadow-cyan-500/30 text-ink-950 hover:bg-cyan-400 transition-colors"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && busy && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 pulse-dot" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[min(620px,74vh)] w-[min(420px,94vw)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-ink-900/95 shadow-2xl backdrop-blur">
          <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30">
                <BrainCircuit className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">CellGuard Copilot</div>
                <div className="text-[11px] text-slate-400">
                  {hasContext ? "Live BMS context" : "no telemetry"} · {getModel()}
                  {usage?.total_tokens ? ` · ${usage.total_tokens} tok` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button onClick={clear} title="Clear chat" className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400"><Trash2 className="h-4 w-4" /></button>
              )}
              <button onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {items.length === 0 && (
              <div className="text-center mt-4">
                <p className="text-sm text-slate-400">Ask me anything about your battery.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      disabled={!configured || busy}
                      className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-[11px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-200 disabled:opacity-40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {items.map(renderItem)}
            {busy && items.length > 0 && items[items.length - 1].role !== "assistant" && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-cyan-400" /> Thinking…
              </div>
            )}
          </div>

          <footer className="border-t border-slate-700 p-3">
            {!configured && (
              <div className="mb-2 text-[11px] text-amber-300 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                Add a DeepSeek API key in <span className="font-semibold">Settings → AI Assistant</span> (this tab only).
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={configured ? "Ask CellGuard Copilot…  (Enter to send)" : "Add API key to enable"}
                className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 placeholder:text-slate-500 max-h-32"
              />
              {busy ? (
                <button onClick={stop} title="Stop" className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-400">
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => submit()}
                  disabled={!input.trim() || !configured}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-ink-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </footer>
        </div>
      )}
    </>
  );
}