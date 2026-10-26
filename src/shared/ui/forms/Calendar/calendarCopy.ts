import { shortDate } from "./calendarDates";

/** Textos do calendário de datas (tom PetHost). */
export const calendarCopy = {
  previousMonth: "Mês anterior",
  nextMonth: "Próximo mês",
  previousYear: "Ano anterior",
  nextYear: "Próximo ano",
  chooseYear: "Escolher o ano",
  previousYears: "Anos anteriores",
  nextYears: "Próximos anos",
  clear: "Limpar",
  done: "Pronto",
  today: "hoje",
  start: "chegada",
  end: "saída",
  weekdays: [
    ["D", "domingo"],
    ["S", "segunda-feira"],
    ["T", "terça-feira"],
    ["Q", "quarta-feira"],
    ["Q", "quinta-feira"],
    ["S", "sexta-feira"],
    ["S", "sábado"],
  ],
  pickDay: "Escolhe o dia.",
  pickStart: "Escolhe o dia da chegada.",
  pickEnd: "Agora escolhe o dia da saída.",
  pickEndLimited: (maxNights: number, lastOut: string) =>
    `Agora a saída: dá pra ficar até ${maxNights} noites, então o último dia é ${shortDate(lastOut)}.`,
  pickEndBeforeClosed: (lastOut: string) =>
    `Agora a saída: dá pra ficar até ${shortDate(lastOut)}, porque o dia seguinte está fechado.`,
  noEndAfter: (start: string) =>
    `Não dá pra sair depois de ${shortDate(start)}: o dia seguinte está fechado. Escolhe outra chegada.`,
  closedInStay: (day: string, reason: string) =>
    `Essas datas passam por ${shortDate(day)}, e ${reason}. Escolhe outras.`,
  /** Amostra do dia riscado na legenda. */
  closedSample: "7",
  rangeDialog: "Escolher as datas da estadia",
  dateDialog: "Escolher a data",
  placeholder: "Escolhe o dia",
  stayLabel: "Chegada e saída",
  stayPlaceholder: "Selecionar datas",
} as const;
