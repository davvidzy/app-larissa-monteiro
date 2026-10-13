import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { readAccess } from "../../lib/access";
import { nowIso } from "./defaults";
import { buildReport, type ServiceReport } from "./report";
import { exportBackup, importBackup, loadData, saveData } from "./storage";
import type { PricingData, Service } from "./types";
import { CostsPanel } from "./ui/CostsPanel";
import { SmallButton, Warning } from "./ui/fields";
import { MaterialsPanel } from "./ui/MaterialsPanel";
import { PrintReport } from "./ui/PrintReport";
import { ServicesPanel } from "./ui/ServicesPanel";
import { ComparePanel, DiscountPanel, MonthPanel } from "./ui/Simulations";

type Tab = "materiais" | "custos" | "servicos" | "descontos" | "mes" | "comparar";

const tabs: { id: Tab; label: string }[] = [
  { id: "materiais", label: "1. Materiais" },
  { id: "custos", label: "2. Custos e taxas" },
  { id: "servicos", label: "3. Serviços" },
  { id: "descontos", label: "Descontos" },
  { id: "mes", label: "Faturamento do mês" },
  { id: "comparar", label: "Comparar" },
];

/** Calculadora de Precificação Lash (Ferramentas → Precificação). */
export function PricingTool() {
  const email = readAccess() ?? "sem-email";
  const [data, setData] = useState<PricingData>(() => loadData(email));
  const [tab, setTab] = useState<Tab>("materiais");
  const [selectedId, setSelectedId] = useState(() => data.services[0]?.id ?? "");
  const [saveFailed, setSaveFailed] = useState(false);
  const [report, setReport] = useState<ServiceReport | null>(null);
  const [backupMessage, setBackupMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Salva a cada alteração
  useEffect(() => {
    setSaveFailed(!saveData(email, data));
  }, [email, data]);

  // Relatório: renderiza a versão de impressão, abre a janela de impressão e limpa depois
  useEffect(() => {
    if (!report) return;
    const clear = () => setReport(null);
    window.addEventListener("afterprint", clear);
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clear);
    };
  }, [report]);

  const update = (fn: (d: PricingData) => PricingData) => setData((d) => ({ ...fn(d), updatedAt: nowIso() }));

  function downloadBackup() {
    const blob = new Blob([exportBackup(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `precificacao-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restoreBackup(file: File) {
    try {
      const restored = importBackup(await file.text());
      if (!window.confirm("Restaurar este backup? Os dados atuais da calculadora serão substituídos.")) return;
      setData(restored);
      setSelectedId(restored.services[0]?.id ?? "");
      setBackupMessage("Backup restaurado.");
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "Não foi possível ler o arquivo.");
    }
  }

  const printService = (service: Service) => setReport(buildReport(service, data));

  return (
    <div className="space-y-4">
      {/* Abas internas da ferramenta */}
      <nav aria-label="Etapas da calculadora" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex gap-1.5">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "step" : undefined}
              onClick={() => setTab(id)}
              className={`min-h-11 shrink-0 rounded-[12px] px-3.5 text-[14px] font-bold transition-colors ${
                tab === id ? "bg-primary text-white" : "bg-surface text-ink-soft shadow-soft hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {saveFailed && (
        <Warning tone="error">
          Este navegador não está permitindo salvar (aba anônima ou armazenamento bloqueado). Baixe um backup para não perder
          seus dados.
        </Warning>
      )}

      {tab === "materiais" && <MaterialsPanel data={data} update={update} />}
      {tab === "custos" && <CostsPanel data={data} update={update} />}
      {tab === "servicos" && (
        <ServicesPanel data={data} update={update} selectedId={selectedId} onSelect={setSelectedId} onPrint={printService} />
      )}
      {tab === "descontos" && <DiscountPanel data={data} selectedId={selectedId} onSelect={setSelectedId} />}
      {tab === "mes" && <MonthPanel data={data} update={update} selectedId={selectedId} onSelect={setSelectedId} />}
      {tab === "comparar" && <ComparePanel data={data} />}

      {/* Salvamento */}
      <section className="rounded-card border border-dashed border-[#DCCFD5] p-4 text-[14px] text-ink-soft">
        <p>
          <strong className="text-ink">Seus dados ficam salvos automaticamente neste aparelho.</strong> Para usar em outro
          celular ou computador, ou para guardar uma cópia, baixe o backup e restaure quando precisar.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <SmallButton onClick={downloadBackup}>
            <Download aria-hidden="true" className="size-4" />
            Baixar backup
          </SmallButton>
          <SmallButton onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" className="size-4" />
            Restaurar backup
          </SmallButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void restoreBackup(file);
              event.target.value = "";
            }}
          />
        </div>
        {backupMessage && (
          <p role="status" className="mt-1 font-medium text-ink">
            {backupMessage}
          </p>
        )}
      </section>

      {report && <PrintReport report={report} />}
    </div>
  );
}
