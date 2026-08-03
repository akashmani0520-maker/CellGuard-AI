import {
  FileText,
  Download,
  FileSpreadsheet,
} from "lucide-react";

import { jsPDF } from "jspdf";
import useBatteryData from "../hooks/useBatteryData";
import useAIPrediction from "../hooks/useAIPrediction";

function Reports() {

  const batteryData = useBatteryData();
  const ai = useAIPrediction(batteryData);

  if (!batteryData) {
    return (
      <div className="text-white text-2xl">
        Loading Report...
      </div>
    );
  }

  const prediction = ai || {
    batteryHealth: batteryData.batteryHealth,
    fireRisk: batteryData.fireRisk,
    confidence: 97,
    remainingLife: "4.2 Years",
    systemStatus: batteryData.systemStatus,
  };

  const downloadPDF = () => {

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("CellGuard AI Battery Report", 20, 20);

    pdf.setFontSize(14);

    pdf.text(`Battery Health : ${prediction.batteryHealth}%`, 20, 40);
    pdf.text(`Temperature : ${batteryData.temperature} °C`, 20, 50);
    pdf.text(`Voltage : ${batteryData.voltage} V`, 20, 60);
    pdf.text(`Current : ${batteryData.current} A`, 20, 70);
    pdf.text(`Fire Risk : ${prediction.fireRisk}%`, 20, 80);
    pdf.text(`AI Confidence : ${prediction.confidence}%`, 20, 90);
    pdf.text(`Remaining Life : ${prediction.remainingLife}`, 20, 100);
    pdf.text(`System Status : ${prediction.systemStatus}`, 20, 110);

    pdf.save("CellGuard_AI_Report.pdf");
  };

  const exportCSV = () => {

    const csv = `Battery Health,Temperature,Voltage,Current,Fire Risk,System Status
${prediction.batteryHealth},${batteryData.temperature},${batteryData.voltage},${batteryData.current},${prediction.fireRisk},${prediction.systemStatus}`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "CellGuard_Report.csv";
    link.click();
  };

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-4xl font-bold">
          Reports
        </h1>

        <p className="text-gray-400 mt-2">
          Generate AI Battery Health Reports.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

          <p className="text-gray-400">
            Battery Health
          </p>

          <h2 className="text-5xl font-bold text-green-400 mt-4">
            {prediction.batteryHealth}%
          </h2>

        </div>

        <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

          <p className="text-gray-400">
            Temperature
          </p>

          <h2 className="text-5xl font-bold text-orange-400 mt-4">
            {batteryData.temperature}°C
          </h2>

        </div>

        <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

          <p className="text-gray-400">
            Voltage
          </p>

          <h2 className="text-5xl font-bold text-blue-400 mt-4">
            {batteryData.voltage}V
          </h2>

        </div>

        <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

          <p className="text-gray-400">
            Fire Risk
          </p>

          <h2 className="text-5xl font-bold text-red-400 mt-4">
            {prediction.fireRisk}%
          </h2>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-6">

        <button
          onClick={downloadPDF}
          className="bg-blue-600 hover:bg-blue-700 rounded-xl p-6 flex justify-center items-center gap-3 text-xl font-semibold"
        >

          <Download />

          Download PDF

        </button>

        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 rounded-xl p-6 flex justify-center items-center gap-3 text-xl font-semibold"
        >

          <FileSpreadsheet />

          Export CSV

        </button>

      </div>

      <div className="bg-[#111827] rounded-xl p-6 border border-gray-800">

        <div className="flex items-center gap-3 mb-5">

          <FileText className="text-blue-400"/>

          <h2 className="text-2xl font-bold">
            AI Report Summary
          </h2>

        </div>

        <div className="space-y-3 text-lg">

          <p>
            Battery Health :
            <span className="text-green-400 font-bold">
              {" "} {prediction.batteryHealth}%
            </span>
          </p>

          <p>
            Fire Risk :
            <span className="text-orange-400 font-bold">
              {" "} {prediction.fireRisk}%
            </span>
          </p>

          <p>
            Remaining Life :
            <span className="text-blue-400 font-bold">
              {" "} {prediction.remainingLife}
            </span>
          </p>

          <p>
            AI Confidence :
            <span className="text-purple-400 font-bold">
              {" "} {prediction.confidence}%
            </span>
          </p>

          <p>
            Current Status :
            <span className="text-green-400 font-bold">
              {" "} {prediction.systemStatus}
            </span>
          </p>

        </div>

      </div>

    </div>

  );
}

export default Reports;