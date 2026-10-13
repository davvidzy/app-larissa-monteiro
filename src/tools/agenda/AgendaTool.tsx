import { type FormEvent, type ReactNode, useId, useState } from "react";
import { CalendarDays, CalendarPlus, ExternalLink, Info, TriangleAlert } from "lucide-react";
import {
  type AppointmentForm,
  buildCalendarUrl,
  computeTimes,
  detectTimeZone,
  formatInZone,
  GOOGLE_CALENDAR_URL,
  LIMITS,
  mentionsHealth,
  services,
  timeZones,
  validate,
} from "./calendar";

/* O formulário fica só na memória da página: nada é salvo no portal. */
const emptyForm = (): AppointmentForm => ({
  service: "",
  date: "",
  time: "",
  durationMinutes: 120,
  client: "",
  location: "",
  notes: "",
  timeZone: detectTimeZone(),
});

const inputClass =
  "w-full rounded-[10px] border bg-surface px-3 py-2.5 text-[16px] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light";
const privateInput = { autoComplete: "off", spellCheck: false } as const;

function Field({ label, error, optional, hint, children, htmlFor }: { label: string; error?: string; optional?: boolean; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[14px] font-bold text-ink">
        {label} {optional && <span className="font-normal text-ink-soft">(opcional)</span>}
      </label>
      {hint && <p className="mt-0.5 text-[12px] text-ink-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p role="alert" className="mt-1 text-[13px] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Assistente de Agendamentos Lash (Ferramentas → Agendamentos). */
export function AgendaTool() {
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [showErrors, setShowErrors] = useState(false);
  const [opened, setOpened] = useState<"" | "ok" | "blocked">("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const id = useId();

  const errors = validate(form);
  const visible = showErrors ? errors : {};
  const times = computeTimes(form);
  const healthWarning = mentionsHealth(form.notes);
  const border = (key: keyof AppointmentForm) => (visible[key] ? "border-error" : "border-[#B7A7AF]");

  const set = <K extends keyof AppointmentForm>(key: K, value: AppointmentForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setOpened("");
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    const url = buildCalendarUrl(form);
    if (!url) return;
    // Sem "noopener" na chamada (com ele o navegador sempre devolve null e não daria para saber
    // se a aba abriu); o acesso da nova aba ao portal é cortado logo em seguida.
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    setFallbackUrl(url);
    setOpened(win === null ? "blocked" : "ok");
  }

  function newAppointment() {
    setForm(emptyForm());
    setShowErrors(false);
    setOpened("");
    setFallbackUrl("");
  }

  return (
    <div className="space-y-4">
      <p className="flex gap-2 rounded-[14px] border border-line bg-surface p-4 text-[14px] text-ink-soft">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Preencha o atendimento e clique em <strong className="text-ink">Adicionar ao Google Calendar</strong>. O evento abre já preenchido na sua
          conta Google, onde você revisa e salva. O portal não guarda nada do que for digitado aqui.
        </span>
      </p>

      <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <section className="space-y-4 rounded-card border border-line bg-surface p-4 shadow-soft md:p-6">
          <Field label="Serviço" htmlFor={`${id}-service`} error={visible.service}>
            <input
              id={`${id}-service`}
              list={`${id}-services`}
              maxLength={LIMITS.service}
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
              placeholder="Escolha ou digite"
              className={`${inputClass} ${border("service")} min-h-12`}
              {...privateInput}
            />
            <datalist id={`${id}-services`}>
              {services.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Data" htmlFor={`${id}-date`} error={visible.date}>
              <input id={`${id}-date`} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={`${inputClass} ${border("date")} min-h-12`} />
            </Field>
            <Field label="Início" htmlFor={`${id}-time`} error={visible.time}>
              <input id={`${id}-time`} type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={`${inputClass} ${border("time")} min-h-12`} />
            </Field>
            <Field label="Duração (min)" htmlFor={`${id}-duration`} error={visible.durationMinutes}>
              <input
                id={`${id}-duration`}
                type="number"
                inputMode="numeric"
                min={LIMITS.minDuration}
                max={LIMITS.maxDuration}
                step={5}
                value={form.durationMinutes ?? ""}
                onChange={(e) => set("durationMinutes", e.target.value === "" ? null : Number(e.target.value))}
                className={`${inputClass} ${border("durationMinutes")} min-h-12`}
              />
            </Field>
          </div>

          <Field label="Fuso horário" htmlFor={`${id}-tz`} error={visible.timeZone}>
            <select id={`${id}-tz`} value={form.timeZone} onChange={(e) => set("timeZone", e.target.value)} className={`${inputClass} ${border("timeZone")} min-h-12`}>
              {timeZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Nome ou referência da cliente"
            optional
            htmlFor={`${id}-client`}
            error={visible.client}
            hint="Vai para o título do evento na sua agenda. Prefira só o primeiro nome ou uma referência (ex.: 'Cliente A')."
          >
            <input id={`${id}-client`} maxLength={LIMITS.client} value={form.client} onChange={(e) => set("client", e.target.value)} className={`${inputClass} ${border("client")} min-h-12`} {...privateInput} />
          </Field>

          <Field label="Local" optional htmlFor={`${id}-location`} error={visible.location}>
            <input id={`${id}-location`} maxLength={LIMITS.location} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex.: Studio, endereço ou 'Atendimento a domicílio'" className={`${inputClass} ${border("location")} min-h-12`} {...privateInput} />
          </Field>

          <Field
            label="Observações administrativas"
            optional
            htmlFor={`${id}-notes`}
            error={visible.notes}
            hint="Ex.: forma de pagamento, lembrete de confirmação. Não inclua informações de saúde: o texto vai para o link e para a sua agenda."
          >
            <textarea id={`${id}-notes`} rows={3} maxLength={LIMITS.notes} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${inputClass} ${border("notes")} resize-y`} {...privateInput} />
            <p className="mt-1 text-right text-[12px] text-[#6C5E66]">
              {form.notes.length}/{LIMITS.notes}
            </p>
          </Field>
          {healthWarning && (
            <p role="alert" className="flex gap-2 rounded-[12px] bg-[#FFFAEB] p-3 text-[13px] font-medium text-[#87510D]">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Parece que as observações mencionam informações de saúde. Retire esse trecho: ele iria para o link do Google Calendar e para a sua agenda. Use a Ficha de
              Anamnese para esse tipo de informação.
            </p>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-card border border-line bg-blush p-4" aria-live="polite">
            <p className="text-[14px] font-bold text-ink">Resumo</p>
            {times ? (
              <dl className="mt-2 space-y-1.5 text-[14px]">
                <div>
                  <dt className="text-ink-soft">Início</dt>
                  <dd className="font-bold text-ink">{formatInZone(times.start, form.timeZone)}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Término</dt>
                  <dd className="font-bold text-ink">{formatInZone(times.end, form.timeZone)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-1 text-[13px] text-ink-soft">Preencha serviço, data, início e duração para ver o horário de término.</p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-button bg-primary px-5 text-[15px] font-bold text-white shadow-soft hover:bg-primary-hover"
          >
            <CalendarPlus aria-hidden="true" className="size-5" />
            Adicionar ao Google Calendar
          </button>

          {opened && (
            <div role="status" className="space-y-2 rounded-[12px] border border-line bg-surface p-3 text-[13px] text-ink">
              {opened === "ok" ? (
                <p>
                  O Google Calendar foi aberto em outra aba com o evento preenchido. <strong>Ele só fica salvo depois que você revisar e clicar em "Salvar" lá.</strong>
                </p>
              ) : (
                <p>
                  Se nenhuma aba abriu, o navegador pode ter bloqueado. Use o link abaixo. <strong>O evento só fica salvo depois que você clicar em "Salvar" no Google Calendar.</strong>
                </p>
              )}
              <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-primary underline">
                <ExternalLink aria-hidden="true" className="size-4" />
                Abrir o evento no Google Calendar
              </a>
              <button type="button" onClick={newAppointment} className="block min-h-11 font-bold text-primary hover:underline">
                Preencher outro atendimento
              </button>
            </div>
          )}

          <a
            href={GOOGLE_CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button border border-primary bg-surface px-4 text-[14px] font-bold text-primary hover:bg-blush"
          >
            <CalendarDays aria-hidden="true" className="size-4" />
            Abrir o Google Calendar
          </a>
        </aside>
      </form>

      <section className="rounded-card border border-line bg-surface p-4 shadow-soft md:p-6">
        <h3 className="text-[17px] font-bold text-ink">Página de agendamentos para suas clientes</h3>
        <p className="mt-2 text-[14px] text-ink-soft">
          Algumas contas do Google Calendar oferecem uma <strong className="text-ink">página de agendamento</strong> (chamada de "Agenda de horários" ou
          "Appointment schedule"): você define os horários disponíveis e recebe um link para as clientes escolherem um horário sozinhas. A disponibilidade do
          recurso e de opções extras (como lembretes e confirmação) depende do tipo da sua conta Google.
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[14px] text-ink">
          <li>Abra o Google Calendar no computador, com a conta que você usa para atender.</li>
          <li>Clique em "Criar" e procure a opção "Agenda de horários" (se ela não aparecer, sua conta não oferece o recurso).</li>
          <li>Defina o nome do serviço, a duração e os dias e horários em que você atende.</li>
          <li>Salve e copie o link da página de agendamento para colocar na bio do Instagram ou enviar pelo WhatsApp.</li>
        </ol>
        <p className="mt-3 text-[13px] text-ink-soft">
          Os nomes dos menus podem mudar. Na dúvida, consulte a ajuda oficial do Google Calendar. As informações que as clientes preencherem nessa página ficam na
          sua conta Google, sob sua responsabilidade.
        </p>
      </section>
    </div>
  );
}
