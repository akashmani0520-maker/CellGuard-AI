import { lazy, Suspense, useState } from "react";
import { Sparkles } from "lucide-react";

// The Copilot (markdown + KaTeX + streaming) is code-split so its heavy
// dependencies only load the first time the user opens it.
const Assistant = lazy(() => import("./Assistant"));

export default function AssistantDock() {
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    return (
      <button
        onClick={() => setMounted(true)}
        title="Open CellGuard Copilot"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/60 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
      >
        <Sparkles className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="fixed bottom-5 right-5 z-40 h-14 w-14 animate-pulse rounded-2xl bg-slate-700/60 border border-slate-600" />
      }
    >
      <Assistant />
    </Suspense>
  );
}
