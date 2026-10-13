import { describe, expect, it } from "vitest";
import { type AppointmentForm, buildCalendarUrl, computeTimes, mentionsHealth, toCalendarStamp, validate, zonedToUtc } from "./calendar";

const form = (o: Partial<AppointmentForm> = {}): AppointmentForm => ({
  service: "Volume brasileiro",
  date: "2026-10-15",
  time: "14:00",
  durationMinutes: 90,
  client: "",
  location: "",
  notes: "",
  timeZone: "America/Sao_Paulo",
  ...o,
});

const params = (url: string) => new URL(url).searchParams;

describe("fuso horário e término", () => {
  it("Brasília (UTC−3): 14:00 + 90 min = 17:00–18:30 UTC", () => {
    expect(params(buildCalendarUrl(form())!).get("dates")).toBe("20261015T170000Z/20261015T183000Z");
  });
  it("cada fuso gera o instante certo", () => {
    expect(toCalendarStamp(zonedToUtc("2026-10-15", "14:00", "America/Manaus"))).toBe("20261015T180000Z"); // UTC−4
    expect(toCalendarStamp(zonedToUtc("2026-10-15", "14:00", "America/Rio_Branco"))).toBe("20261015T190000Z"); // UTC−5
    expect(toCalendarStamp(zonedToUtc("2026-10-15", "14:00", "America/Noronha"))).toBe("20261015T160000Z"); // UTC−2
  });
  it("considera horário de verão onde existe", () => {
    expect(toCalendarStamp(zonedToUtc("2026-07-15", "14:00", "Europe/Lisbon"))).toBe("20260715T130000Z"); // verão UTC+1
    expect(toCalendarStamp(zonedToUtc("2026-01-15", "14:00", "Europe/Lisbon"))).toBe("20260115T140000Z"); // inverno UTC+0
  });
  it("atendimento que passa da meia-noite termina no dia seguinte", () => {
    const t = computeTimes(form({ time: "23:30", durationMinutes: 60 }))!;
    expect(toCalendarStamp(t.end)).toBe("20261016T033000Z");
  });
});

describe("link do Google Calendar", () => {
  it("usa action=TEMPLATE e os parâmetros pedidos", () => {
    const p = params(buildCalendarUrl(form({ client: "Ana", location: "Studio Olhar, Sala 2", notes: "Levar referências" }))!);
    expect(p.get("action")).toBe("TEMPLATE");
    expect(p.get("text")).toBe("Volume brasileiro — Ana");
    expect(p.get("location")).toBe("Studio Olhar, Sala 2");
    expect(p.get("details")).toContain("Levar referências");
    expect(p.get("stz")).toBe("America/Sao_Paulo");
    expect(p.get("etz")).toBe("America/Sao_Paulo");
    expect(buildCalendarUrl(form())!.startsWith("https://calendar.google.com/calendar/render?")).toBe(true);
  });
  it("codifica acentos e caracteres especiais sem quebrar a URL", () => {
    const tricky = "Manutenção & retoque #2 ?x=1 / 100% “ok”\nlinha 2";
    const url = buildCalendarUrl(form({ service: "Extensão & cia", notes: tricky, location: "Rua Ação, 10 #3" }))!;
    const query = url.split("?")[1];
    expect(query).not.toMatch(/[\s#“”ãç]/); // nada cru: tudo codificado
    expect(query.split("&")).toHaveLength(8); // o "&" do texto não criou parâmetro extra
    const p = params(url);
    expect(p.get("text")).toBe("Extensão & cia");
    expect(p.get("details")).toContain(tricky);
    expect(p.get("location")).toBe("Rua Ação, 10 #3");
    expect([...p.keys()].sort()).toEqual(["action", "ctz", "dates", "details", "etz", "location", "stz", "text"]);
  });
  it("cliente e local são opcionais (sem parâmetros vazios)", () => {
    const p = params(buildCalendarUrl(form())!);
    expect(p.get("text")).toBe("Volume brasileiro");
    expect(p.has("location")).toBe(false);
  });
});

describe("validação", () => {
  it("não gera link com dados inválidos", () => {
    expect(validate(form({ service: " " })).service).toBeDefined();
    expect(validate(form({ date: "2026-02-30" })).date).toBeDefined();
    expect(validate(form({ time: "25:00" })).time).toBeDefined();
    expect(validate(form({ durationMinutes: 0 })).durationMinutes).toBeDefined();
    expect(validate(form({ durationMinutes: 45.5 })).durationMinutes).toBeDefined();
    expect(validate(form({ timeZone: "Mars/Base" })).timeZone).toBeDefined();
    expect(buildCalendarUrl(form({ durationMinutes: null }))).toBeNull();
    expect(validate(form())).toEqual({});
  });
  it("detecta menções a saúde nas observações (para avisar)", () => {
    expect(mentionsHealth("Cliente com alergia a cola")).toBe(true);
    expect(mentionsHealth("Pagamento via Pix")).toBe(false);
  });
});
