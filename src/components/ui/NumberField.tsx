import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
};

/** Campo numérico em texto livre: aceita vírgula ("25,90"), como a aluna digita no Brasil. */
export function NumberField({ label, value, onChange, prefix, suffix, hint }: Props) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-bold text-ink">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-[13px] text-ink-soft">{hint}</p>}
      <div className="mt-1.5 flex min-h-12 items-center rounded-[10px] border border-[#B7A7AF] bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
        {prefix && <span className="mr-1.5 text-[15px] text-ink-soft">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 bg-transparent py-2 text-[16px] text-ink outline-none"
        />
        {suffix && <span className="ml-1.5 shrink-0 text-[14px] text-ink-soft">{suffix}</span>}
      </div>
    </div>
  );
}
