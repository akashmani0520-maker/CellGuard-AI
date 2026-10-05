import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Card } from "./ui";
import { generateReport } from "../lib/reportAI";
import Markdown from "./Markdown";
import { hasApiKey } from "../lib/deepseek";

export default function AISummary({ title, payload, disabled, compact, onGenerated }) {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const configured = hasApiKey();
  const canRun = Boolean(payload) && !disabled;

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const text = await generateReport(title, payload);
      const clean = text.replace(/^\s+/, "");
      setResult(clean);
      if (onGenerated) onGenerated(clean);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Card
      icon={<Sparkles className="h-4 w-4 text-purple-300" />}
      title={title}
      subtitle="Generative-AI executive report via DeepSeek"
      actions={
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={copy} title="Copy report" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          <button
            onClick={generate}
            disabled={busy || !canRun}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Generating…" : "Generate report"}
          </button>
        </div>
      }
    >
      {!configured && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          This needs a DeepSeek API key — add one in <span className="font-semibold">Settings → AI Assistant</span>.
        </div>
      )}

      {busy && (
        <div className="shimmer h-24 rounded-lg border border-slate-800" />
      )}

      {error && !busy && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="whitespace-pre-wrap">{error}</span>
        </div>
      )}

      {result && !busy && (
        <div className={`rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 ${compact ? "max-h-80 overflow-y-auto" : ""}`}>
          <Markdown content={result} />
        </div>
      )}

      {!result && !busy && !error && configured && (
        <div className="text-sm text-slate-500 py-4 text-center">
          Press <span className="text-purple-300">Generate report</span> for an executive summary of this data.
        </div>
      )}
    </Card>
  );
}