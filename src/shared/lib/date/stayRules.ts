/** Brasília em UTC−3 fixo, como o `BookingClock` da API (o Brasil não tem horário de verão desde 2019). */
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;
const MAX_ADVANCE_DAYS = 365;
const MAX_NIGHTS = 30;
/**
 * Antecedência mínima do pedido: a API exige 72 h entre agora e a meia-noite (Brasília) do dia da chegada (`Booking.MinimumRequestNotice`:
 * 24 h do anfitrião responder + 48 h até a chegada em que ele ainda pode aceitar). Com `today` em Brasília, a primeira
 * chegada possível é daqui a 4 dias: hoje + 72 h cai no meio do dia 3 e a meia-noite seguinte é a do dia 4 (só às 00:00 em
 * ponto o dia 3 serviria; a régua de dias inteiros erra para o lado seguro). A busca não usa a regra: ela só procura.
 */
const MIN_REQUEST_LEAD_DAYS = 4;

/**
 * O dia de hoje em Brasília (`yyyy-MM-dd`), a régua das regras de estadia da API (chegada, janela do check-in). Às 23h
 * do dia 19 em Brasília ainda é dia 19, qualquer que seja o fuso do navegador.
 *
 * @example brasiliaToday(new Date("2026-12-20T02:00:00Z")) // "2026-12-19"
 */
export function brasiliaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
}

function dateTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN;
}

/** Soma dias de calendário; entrada inválida retorna string vazia. @example addDays("2026-12-31", 1) // "2027-01-01" */
export function addDays(date: string, days: number): string {
  const time = dateTime(date) + days * DAY_MS;
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : "";
}

/** Noites entre datas ISO, sem DST; inválido retorna NaN. @example nightsBetween("2026-10-15", "2026-10-17") // 2 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return (dateTime(checkOut) - dateTime(checkIn)) / DAY_MS;
}

/**
 * Regras da API: chegada de hoje até 365 dias, saída depois, até 30 noites.
 * Sem as duas datas permite busca sem período. Erros são por campo.
 * @example validateStay("2026-10-15", "2026-10-17", "2026-10-15") // {}
 */
export function validateStay(
  checkIn: string,
  checkOut: string,
  today: string,
): Partial<Record<"checkIn" | "checkOut", string>> {
  if (!checkIn && !checkOut) return {};
  const errors: Partial<Record<"checkIn" | "checkOut", string>> = {};
  if (!Number.isFinite(dateTime(checkIn))) errors.checkIn = "Escolhe uma data de chegada válida.";
  else if (checkIn < today || checkIn > addDays(today, MAX_ADVANCE_DAYS))
    errors.checkIn = "A chegada pode ser de hoje até 365 dias à frente.";
  if (!Number.isFinite(dateTime(checkOut))) errors.checkOut = "Escolhe uma data de saída válida.";
  else if (Number.isFinite(dateTime(checkIn))) {
    const nights = nightsBetween(checkIn, checkOut);
    if (nights <= 0) errors.checkOut = "A saída precisa ser depois da chegada.";
    else if (nights > MAX_NIGHTS) errors.checkOut = "Escolhe uma estadia de até 30 noites.";
  }
  return errors;
}

/**
 * A frase da antecedência mínima do pedido: a mesma na validação local e na recusa da API (`BOOKING_CHECK_IN_TOO_SOON`,
 * com `minimumHours` e `responseHours` dos params).
 *
 * @example requestLeadMessage() // "A chegada precisa ser daqui a pelo menos 3 dias: o anfitrião tem 24 horas pra responder."
 */
export function requestLeadMessage(minimumHours = 72, responseHours = 24): string {
  const days = Math.ceil(minimumHours / 24);
  return `A chegada precisa ser daqui a pelo menos ${days} ${days === 1 ? "dia" : "dias"}: o anfitrião tem ${responseHours} horas pra responder.`;
}

/** Primeira chegada que a API aceita num pedido feito hoje (Brasília). @example earliestRequestCheckIn("2026-10-23") // "2026-10-27" */
export function earliestRequestCheckIn(today: string): string {
  return addDays(today, MIN_REQUEST_LEAD_DAYS);
}

/**
 * Regras do pedido de estadia: as da estadia mais a antecedência mínima de 72 h da chegada. Pedido exige as duas datas.
 * @example validateRequestStay("2026-10-24", "2026-10-26", "2026-10-23").checkIn // "A chegada precisa ser daqui a pelo menos 3 dias: …"
 */
export function validateRequestStay(
  checkIn: string,
  checkOut: string,
  today: string,
): Partial<Record<"checkIn" | "checkOut", string>> {
  const errors = validateStay(checkIn || " ", checkOut || " ", today);
  if (!errors.checkIn && checkIn < earliestRequestCheckIn(today)) errors.checkIn = requestLeadMessage();
  return errors;
}
