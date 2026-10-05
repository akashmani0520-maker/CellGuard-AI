import { useEffect } from "react";
import { Clock } from "lucide-react";
import { Card, Readout, Pill } from "../components/ui";
import PeriodSelector from "../components/PeriodSelector";
import { VoltageChart, CurrentChart, TemperatureChart } from "../components/Charts";
import usePeriodHistory, { nowMs } from "../hooks/usePeriodHistory";
import { fmtTime, fmtVolt, fmtAmp, fmt, fmtPct, fmtAh, fmtWh } from "../lib/format";
import AISummary from "../components/AISummary";
import { periodReportPayload } from "../lib/reportAI";

export default function History() {
  const { range, items, loading, error, load, stats, deltas, series } = usePeriodHistory();

  useEffect(() => {
    if (!range) load(nowMs() - 24 * 3600 * 1000, nowMs());
  }, [range, load]);

  const rows = items.slice().reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Period Analysis</h2>
        <p className="text-sm text-slate-400">Select a time window to analyse battery behaviour, energy and faults.</p>
      </div>

      <PeriodSelector onApply={load} loading={loading} defaultValue={range} />

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      )}

      {loading && <div className="panel p-6 text-sm text-slate-400">Loading period samples…</div>}

      {!loading && stats.count === 0 && !error && (
        <div className="panel p-8 text-center text-sm text-slate-500">No samples found in this period.</div>
      )}

      {!loading && stats.count > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Readout label="Samples" value={fmt(stats.count, 0)} sub={range ? `${fmtTime(stats.startTs)} \u2192 ${fmtTime(stats.endTs)}` : ""} />
            <Readout label="Pack Voltage" value={`${stats.packVoltage.min.toFixed(2)}\u2013${stats.packVoltage.max.toFixed(2)} V`} sub={`avg ${stats.packVoltage.avg.toFixed(2)} V`} toneKey={stats.packVoltage.min < 0 ? "danger" : "ok"} />
            <Readout label="Pack Current" value={`${stats.packCurrent.min.toFixed(1)}\u2013${stats.packCurrent.max.toFixed(1)} A`} sub={`avg ${stats.packCurrent.avg.toFixed(1)} A`} />
            <Readout label="Pack Power" value={`${fmt(stats.packPower.min, 0)}\u2013${fmt(stats.packPower.max, 0)} W`} sub={`avg ${fmt(stats.packPower.avg, 0)} W`} />
            <Readout label="SOC" value={`${stats.soc.min.toFixed(1)}\u2013${stats.soc.max.toFixed(1)}%`} sub={`avg ${stats.soc.avg.toFixed(1)}%`} />
            <Readout label="Peak Temp" value={`${stats.overallMaxTemp.toFixed(1)}\u00b0C`} toneKey={stats.overallMaxTemp > 45 ? "danger" : stats.overallMaxTemp > 38 ? "warning" : "ok"} />
            <Readout label="Avg Cell" value={`${stats.cellAvg.avg.toFixed(3)} V`} toneKey={stats.cellAvg.avg <= 0 ? "danger" : "ok"} />
            <Readout label="Fault Samples" value={`${stats.faultSamples}/${stats.count}`} toneKey={stats.faultSamples ? "warning" : "safe"} />
          </div>

          {/* Energy deltas + faults/anomalies */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card icon={<Clock className="h-4 w-4 text-amber-300" />} title="Energy in Period" subtitle="Cumulative coulomb / energy deltas within the window">
              <div className="grid grid-cols-2 gap-3">
                <Readout label="Charge Ah" value={deltas.available ? fmtAh(deltas.ahIn) : "n/a"} />
                <Readout label="Discharge Ah" value={deltas.available ? fmtAh(deltas.ahOut) : "n/a"} />
                <Readout label="Charge Wh" value={deltas.available ? fmtWh(deltas.whIn) : "n/a"} />
                <Readout label="Discharge Wh" value={deltas.available ? fmtWh(deltas.whOut) : "n/a"} />
              </div>
              {!deltas.available && <p className="mt-3 text-xs text-slate-500">Need at least two samples to compute a delta.</p>}
            </Card>

            <Card title="Issues in Period" subtitle="Fault flags and anomalies seen across samples">
              {Object.keys(stats.anomalies).length === 0 && Object.keys(stats.faults).length === 0 ? (
                <div className="text-sm text-emerald-300">No faults or AI anomalies recorded in this window.</div>
              ) : (
                <div className="space-y-3">
                  {Object.keys(stats.anomalies).length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">AI anomalies</div>
                      <ul className="space-y-1">
                        {Object.entries(stats.anomalies).map(([a, c]) => (
                          <li key={a} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-sm text-amber-200 font-mono">
                            {a} <span className="text-amber-400/70 text-xs">× {c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Object.keys(stats.faults).length > 0 && (
                    <div className="text-xs text-slate-400">
                      <span className="uppercase tracking-wider">{stats.faultSamples} sample{stats.faultSamples === 1 ? "" : "s"} carried active faults</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Period charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="panel p-5"><div className="text-sm font-semibold text-slate-100 mb-4">Voltage — {fmt(stats.count, 0)} pts</div><VoltageChart data={series} height={240} /></div>
            <div className="panel p-5"><div className="text-sm font-semibold text-slate-100 mb-4">Current / Power</div><CurrentChart data={series} height={240} /></div>
            <div className="panel p-5 xl:col-span-2"><div className="text-sm font-semibold text-slate-100 mb-4">Temperature</div><TemperatureChart data={series} height={240} /></div>
          </div>

          <AISummary title="Period AI Report" payload={periodReportPayload({ range, stats, deltas })} disabled={stats.count === 0} />

          {/* Samples table */}
          <Card title="Period Samples" subtitle={`${rows.length} recorded samples (newest first)`} actions={<Pill toneKey="ok">period</Pill>}>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Pack (V)</th>
                    <th className="py-2 pr-3">I (A)</th>
                    <th className="py-2 pr-3">P (W)</th>
                    <th className="py-2 pr-3">SOC</th>
                    <th className="py-2 pr-3">Cells 1/2/3</th>
                    <th className="py-2 pr-3">Temp (max)</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const t = r.telemetry || {};
                    const safe = r.analysis?.is_safe !== false;
                    const cells = Array.isArray(t.cell_voltage) ? t.cell_voltage.map((v) => Number(v).toFixed(3)).join(" / ") : "\u2014";
                    const temps = Array.isArray(t.temperature) ? t.temperature.map(Number) : [];
                    const maxT = temps.length ? Math.max(...temps) : 0;
                    return (
                      <tr key={r.timestamp} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="py-2.5 pr-3 text-slate-300 tabular">{fmtTime(r.timestamp)}</td>
                        <td className={`py-2.5 pr-3 tabular ${t.pack_voltage <= 0 ? "text-rose-300" : "text-slate-100"}`}>{fmtVolt(t.pack_voltage)}</td>
                        <td className="py-2.5 pr-3 tabular text-slate-100">{fmtAmp(t.pack_current)}</td>
                        <td className="py-2.5 pr-3 tabular text-slate-100">{fmt(t.pack_power, 0)} W</td>
                        <td className="py-2.5 pr-3 tabular text-cyan-200">{fmtPct(t.soc, 1)}</td>
                        <td className="py-2.5 pr-3 tabular text-slate-300">{cells}</td>
                        <td className="py-2.5 pr-3 tabular text-amber-200">{temps.length ? `${maxT.toFixed(1)}\u00b0C` : "\u2014"}</td>
                        <td className="py-2.5"><Pill toneKey={safe ? "safe" : "danger"}>{safe ? "OK" : "Flagged"}</Pill></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}