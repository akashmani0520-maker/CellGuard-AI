import { FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, Pill } from "../components/ui";
import { useDevice } from "../context/DeviceContext";
import { useTelemetryCtx } from "../context/TelemetryContext";
import AISummary from "../components/AISummary";
import { snapshotReportPayload } from "../lib/reportAI";
import { fmtVolt, fmtAmp, fmt, fmtTime, fmtPct } from "../lib/format";

function buildCsv(history) {
  const head = ["timestamp", "pack_voltage", "pack_current", "pack_power", "soc", "temp1", "temp2", "temp3"];
  const lines = history.map((r) => {
    const t = r.telemetry || {};
    const temps = Array.isArray(t.temperature) ? t.temperature : [];
    return [
      r.timestamp,
      t.pack_voltage, t.pack_current, t.pack_power, t.soc,
      temps[0] ?? "", temps[1] ?? "", temps[2] ?? "",
    ].join(",");
  });
  return [head.join(","), ...lines].join("\n");
}

export default function Reports() {
  const { latest, history } = useTelemetryCtx();
  const { deviceId } = useDevice();
  const [busy, setBusy] = useState(false);
  const [aiReport, setAiReport] = useState("");

  const exportCsv = () => {
    const blob = new Blob([buildCsv(history)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cellguard-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const mod = await import("jspdf");
    const { jsPDF } = mod;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const t = latest?.telemetry || {};
    const safe = latest?.analysis?.is_safe !== false;

    doc.setFontSize(18); doc.setTextColor(10, 20, 40);
    doc.text("CellGuard AI — BMS Report", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Device: ${deviceId || "NANO_ESP_BMS_NODE_01"} · Generated ${new Date().toLocaleString()}`, 14, 27);

    const summary = [
      ["Pack Voltage", fmtVolt(t.pack_voltage)],
      ["Pack Current", fmtAmp(t.pack_current)],
      ["Pack Power", `${fmt(t.pack_power, 0)} W`],
      ["State of Charge", fmtPct(t.soc, 1)],
      ["State of Health", fmtPct(t.soh_percent, 1)],
      ["Cycle Count", fmt(t.cycle_count, 0)],
      ["Status", safe ? "SAFE" : "ANOMALOUS"],
    ];
    autoTable(doc, { startY: 34, head: [["Parameter", "Value"]], body: summary });
    let cursor = doc.lastAutoTable ? doc.lastAutoTable.finalY : 34;

    if (aiReport && aiReport.trim()) {
      cursor += 12;
      doc.setFontSize(13);
      doc.setTextColor(15, 20, 40);
      doc.text("AI Executive Summary", 14, cursor);
      cursor += 6;
      doc.setFontSize(10);
      doc.setTextColor(70, 75, 85);
      const lines = doc.splitTextToSize(aiReport, 184);
      doc.text(lines, 14, cursor);
      cursor += lines.length * 4.8 + 8;
    }

    const cols = ["Time", "Pack (V)", "I (A)", "P (W)", "SOC"].concat(["T1", "T2", "T3"]);
    const rows = history.slice().reverse().slice(0, 200).map((r) => {
      const x = r.telemetry || {};
      const temps = Array.isArray(x.temperature) ? x.temperature.map((v) => Number(v).toFixed(1)) : [];
      return [fmtTime(r.timestamp), fmtVolt(x.pack_voltage), fmtAmp(x.pack_current), `${fmt(x.pack_power, 0)} W`, fmtPct(x.soc, 1)].concat(temps.length ? temps : ["", "", ""]);
    });
    autoTable(doc, { startY: cursor, head: [cols], body: rows });

    doc.save("cellguard-bms-report.pdf");
  };

  return (
    <div className="space-y-6">
    <Card
      icon={<FileText className="h-4 w-4 text-cyan-300" />}
      title="Reports & Export"
      subtitle="Generate a summary snapshot as PDF or CSV"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"><Download className="h-3.5 w-3.5" /> CSV</button>
          <button onClick={async () => { setBusy(true); try { await exportPdf(); } finally { setBusy(false); } }} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF Report
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Pill toneKey={latest?.analysis?.is_safe ? "safe" : "danger"}>{latest?.analysis?.is_safe ? "SAFE" : "ANOMALOUS"}</Pill>
        <div className="text-sm text-slate-300">{history.length} samples available</div>
        <div className="text-sm text-slate-300">{deviceId}</div>
        <div className="text-sm text-slate-300">Export includes latest 200 rows</div>
      </div>
    </Card>

      <AISummary title="Live Dataset Report" payload={snapshotReportPayload(latest)} disabled={!latest} onGenerated={setAiReport} />
    </div>
  );
}
