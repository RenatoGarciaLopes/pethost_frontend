/** Número inteiro em pt-BR, com separador de milhar. @example formatCount(1500) // "1.500" */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** Singular ou plural pelo número. @example plural(1, "hora", "horas") // "1 hora" */
export function plural(value: number, one: string, many: string): string {
  return `${formatCount(value)} ${value === 1 ? one : many}`;
}

/** Duração em horas. @example formatHours(72) // "72 horas" */
export function formatHours(hours: number): string {
  return plural(hours, "hora", "horas");
}

/** Data `yyyy-MM-dd` como `dd/MM`. @example formatDayMonth("2026-12-24") // "24/12" */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}
