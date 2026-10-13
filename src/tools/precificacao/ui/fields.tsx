import { type ReactNode, useEffect, useId, useState } from "react";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { centsToInput, numberToInput, parseCents, parseDecimal } from "../money";

type NumKind = "money" | "decimal" | "integer" | "percent";

const boxClass =
  "flex min-h-11 items-center rounded-[10px] border bg-surface px-3 focus-within:ring-2 focus-within:ring-primary-light";

type NumInputProps = {
  label: string;
  /** Centavos quando kind = "money"; número nos demais. */
  value: number | null;
  onChange: (value: number | null) => void;
  kind?: NumKind;
  suffix?: string;
  hint?: string;
  /** Limite superior exclusivo (ex.: 100 para percentuais que não podem chegar a 100%). */
  maxExclusive?: number;
  placeholder?: string;
  hideLabel?: boolean;
  className?: string;
};

/**
 * Campo numérico que aceita o jeito brasileiro de digitar ("25,90", "1.250").
 * Só repassa valores válidos; um texto inválido mostra o erro e mantém o último valor válido.
 */
export function NumInput({ label, value, onChange, kind = "decimal", suffix, hint, maxExclusive, placeholder, hideLabel, className = "" }: NumInputProps) {
  const id = useId();
  const format = (v: number | null) => (kind === "money" ? centsToInput(v) : numberToInput(v));
  const [text, setText] = useState(() => format(value));
  const [focused, setFocused] = useState(false);

  // Valor alterado por fora (ex.: trocar de serviço): atualiza o texto se não estiver digitando
  useEffect(() => {
    if (!focused) setText(format(value));
  }, [value, focused]);

  const parsed = kind === "money" ? parseCents(text) : parseDecimal(text);
  let error = "";
  if (parsed !== null) {
    if (Number.isNaN(parsed)) error = "Digite só números (ex.: 25,90).";
    else if (parsed < 0) error = "Não pode ser negativo.";
    else if (kind === "integer" && !Number.isInteger(parsed)) error = "Use um número inteiro.";
    else if (maxExclusive !== undefined && parsed >= maxExclusive) error = `Precisa ser menor que ${maxExclusive}${kind === "percent" ? "%" : ""}.`;
  }

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-[14px] font-bold text-ink"}>
        {label}
      </label>
      {hint && !hideLabel && <p className="mt-0.5 text-[13px] text-ink-soft">{hint}</p>}
      <div className={`${boxClass} ${hideLabel ? "" : "mt-1.5"} ${error ? "border-error" : "border-[#B7A7AF] focus-within:border-primary"}`}>
        {kind === "money" && <span className="mr-1.5 text-[15px] text-ink-soft">R$</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          aria-invalid={!!error}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            const v = kind === "money" ? parseCents(next) : parseDecimal(next);
            const ok =
              v === null ||
              (!Number.isNaN(v) && v >= 0 && (kind !== "integer" || Number.isInteger(v)) && (maxExclusive === undefined || v < maxExclusive));
            if (ok) onChange(v);
          }}
          className="w-full min-w-0 bg-transparent py-2 text-[16px] text-ink outline-none placeholder:text-[#B7A7AF]"
        />
        {(suffix || kind === "percent") && <span className="ml-1.5 shrink-0 text-[14px] text-ink-soft">{suffix ?? "%"}</span>}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ label, value, onChange, hideLabel, className = "" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-[14px] font-bold text-ink"}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${hideLabel ? "" : "mt-1.5"} min-h-11 w-full rounded-[10px] border border-[#B7A7AF] bg-surface px-3 py-2 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light`}
      />
    </div>
  );
}

/** Explicação curta de um conceito. */
export function Help({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-[13px] leading-snug text-ink-soft">
      <Info aria-hidden="true" className="mt-px size-4 shrink-0 text-rose" />
      <span>{children}</span>
    </p>
  );
}

export function Warning({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "error" }) {
  const Icon = tone === "error" ? CircleAlert : TriangleAlert;
  const colors = tone === "error" ? "bg-[#FFF2F3] text-[#AA2841]" : "bg-[#FFFAEB] text-[#87510D]";
  return (
    <div role="status" className={`flex gap-2 rounded-[12px] px-3.5 py-3 text-[14px] font-medium ${colors}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Bloco de conteúdo com título. */
export function Panel({ title, description, children, actions }: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[18px] leading-snug font-bold text-ink">{title}</h3>
          {description && <div className="mt-1.5">{description}</div>}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Linha "rótulo ........ valor" dos resultados. */
export function Row({ label, value, strong, muted, help }: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean; help?: string }) {
  return (
    <div className="border-b border-line py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <dt className={strong ? "font-bold text-ink" : "text-[14px] text-ink-soft"}>{label}</dt>
        <dd className={`text-right whitespace-nowrap tabular-nums ${strong ? "text-[20px] font-bold text-primary" : muted ? "text-[14px] text-ink-soft" : "font-medium text-ink"}`}>
          {value}
        </dd>
      </div>
      {help && <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{help}</p>}
    </div>
  );
}

/** Botão pequeno de ação (adicionar, duplicar, excluir…). */
export function SmallButton({ children, onClick, tone = "default", label, disabled }: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-button px-3 text-[14px] font-bold transition-colors disabled:opacity-40 ${
        tone === "danger" ? "text-[#AA2841] hover:bg-[#FFF2F3]" : "text-primary hover:bg-blush"
      }`}
    >
      {children}
    </button>
  );
}
