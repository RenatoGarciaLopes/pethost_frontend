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
  rangeDialog: "Escolher as datas da estadia",
  dateDialog: "Escolher a data",
  placeholder: "Escolhe o dia",
} as const;
