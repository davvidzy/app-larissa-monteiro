/* Assistente de Agendamentos: cálculo do término e link "TEMPLATE" do Google Calendar.
   Sem API, sem OAuth e sem armazenamento: o portal só monta o link; quem salva o
   evento é a profissional, na própria conta Google. */

export const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/r";
const TEMPLATE_URL = "https://calendar.google.com/calendar/render";

/** Fusos do Brasil (rótulo → identificador IANA). */
export const timeZones: { id: string; label: string }[] = [
  { id: "America/Sao_Paulo", label: "Brasília (SP, RJ, MG, Sul, GO, DF…)" },
  { id: "America/Bahia", label: "Bahia" },
  { id: "America/Fortaleza", label: "Fortaleza (CE, RN, PB, PI, MA)" },
  { id: "America/Recife", label: "Recife (PE)" },
  { id: "America/Maceio", label: "Maceió (AL, SE)" },
  { id: "America/Belem", label: "Belém (PA, AP)" },
  { id: "America/Araguaina", label: "Tocantins" },
  { id: "America/Cuiaba", label: "Cuiabá (MT)" },
  { id: "America/Campo_Grande", label: "Campo Grande (MS)" },
  { id: "America/Manaus", label: "Manaus (AM)" },
  { id: "America/Porto_Velho", label: "Porto Velho (RO)" },
  { id: "America/Boa_Vista", label: "Boa Vista (RR)" },
  { id: "America/Rio_Branco", label: "Rio Branco (AC)" },
  { id: "America/Noronha", label: "Fernando de Noronha" },
];

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

/** Fuso do aparelho, se for um dos fusos do Brasil; senão, Brasília. */
export function detectTimeZone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZones.some((z) => z.id === tz) ? tz : DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

export const services = ["Extensão clássica", "Volume brasileiro", "Volume híbrido", "Manutenção", "Remoção", "Consulta prévia"];

export const LIMITS = { service: 80, client: 60, location: 120, notes: 500, minDuration: 5, maxDuration: 720 };

export type AppointmentForm = {
  service: string;
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  durationMinutes: number | null;
  client: string;
  location: string;
  notes: string;
  timeZone: string;
};

/* -------------------------------------------------------------------------- */
/* Fuso horário sem bibliotecas: usa o Intl do próprio navegador              */
/* -------------------------------------------------------------------------- */

/** Diferença (ms) entre o horário local do fuso e o UTC num instante. */
function tzOffset(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - utcMs;
}

/** "2026-10-15" + "14:00" no fuso escolhido → instante UTC (ms). Considera horário de verão. */
export function zonedToUtc(date: string, time: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, min);
  let utc = asUtc - tzOffset(asUtc, timeZone);
  utc = asUtc - tzOffset(utc, timeZone); // segunda passada acerta mudanças de horário
  return utc;
}

/** Instante UTC → "20261015T170000Z" (formato do parâmetro dates). */
export function toCalendarStamp(utcMs: number) {
  return new Date(utcMs).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Horário local (no fuso escolhido) para mostrar na tela. */
export function formatInZone(utcMs: number, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone, weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(utcMs),
  );
}

/* -------------------------------------------------------------------------- */
/* Validação e link                                                           */
/* -------------------------------------------------------------------------- */

export function isValidDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return y >= 2000 && y <= 2100 && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export type FormErrors = Partial<Record<keyof AppointmentForm, string>>;

export function validate(form: AppointmentForm): FormErrors {
  const e: FormErrors = {};
  if (!form.service.trim()) e.service = "Informe o serviço.";
  else if (form.service.length > LIMITS.service) e.service = `Use no máximo ${LIMITS.service} caracteres.`;
  if (!isValidDate(form.date)) e.date = "Informe uma data válida.";
  if (!isValidTime(form.time)) e.time = "Informe um horário válido (ex.: 14:30).";
  const d = form.durationMinutes;
  if (d === null || !Number.isInteger(d) || d < LIMITS.minDuration || d > LIMITS.maxDuration)
    e.durationMinutes = `A duração deve ser um número inteiro entre ${LIMITS.minDuration} e ${LIMITS.maxDuration} minutos.`;
  if (form.client.length > LIMITS.client) e.client = `Use no máximo ${LIMITS.client} caracteres.`;
  if (form.location.length > LIMITS.location) e.location = `Use no máximo ${LIMITS.location} caracteres.`;
  if (form.notes.length > LIMITS.notes) e.notes = `Use no máximo ${LIMITS.notes} caracteres.`;
  if (!timeZones.some((z) => z.id === form.timeZone)) e.timeZone = "Escolha um fuso horário.";
  return e;
}

/** Início e término (UTC) do atendimento. null = dados inválidos. */
export function computeTimes(form: AppointmentForm) {
  if (Object.keys(validate(form)).length) return null;
  const start = zonedToUtc(form.date, form.time, form.timeZone);
  return { start, end: start + form.durationMinutes! * 60_000 };
}

/**
 * Link do Google Calendar (action=TEMPLATE) com o evento pré-preenchido.
 * As datas vão em UTC (com "Z"), o que torna o horário inequívoco em qualquer conta;
 * stz/etz/ctz informam o fuso escolhido para exibição no Google Calendar.
 * URLSearchParams codifica todos os valores (acentos, &, #, quebras de linha…).
 */
export function buildCalendarUrl(form: AppointmentForm): string | null {
  const times = computeTimes(form);
  if (!times) return null;
  const title = form.client.trim() ? `${form.service.trim()} — ${form.client.trim()}` : form.service.trim();
  const details = [form.notes.trim(), "Criado com o Assistente de Agendamentos Lash (Bellash Academy)."].filter(Boolean).join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toCalendarStamp(times.start)}/${toCalendarStamp(times.end)}`,
    details,
    stz: form.timeZone,
    etz: form.timeZone,
    ctz: form.timeZone,
  });
  if (form.location.trim()) params.set("location", form.location.trim());
  return `${TEMPLATE_URL}?${params.toString()}`;
}

/* Termos que costumam indicar dado de saúde: só para avisar, nunca para bloquear. */
const HEALTH_HINT = /alerg|rea[çc][ãa]o|irrita|conjuntiv|cirurg|gr[áa]vid|gestante|medica[çm]|rem[ée]dio|doen[çc]a|diagn[óo]st|infec|inflama|dor\b|sens[íi]vel|sensibilidade/i;

export const mentionsHealth = (text: string) => HEALTH_HINT.test(text);
