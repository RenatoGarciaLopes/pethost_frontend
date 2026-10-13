/** Mês por extenso e ano no fuso de São Paulo; exige ISO válido. @example formatMemberSince("2026-10-13T12:00:00Z") // "outubro de 2026" */
export function formatMemberSince(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "long", year: "numeric" }).format(
    new Date(date),
  );
}
