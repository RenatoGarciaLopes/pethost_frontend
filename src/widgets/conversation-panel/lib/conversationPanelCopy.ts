/** Textos do painel da conversa com o contexto da estadia (spec 055, em rascunho). Sem gênero presumido. */
export const conversationPanelCopy = {
  subtitle: (listingTitle: string, neighborhood: string) => `${listingTitle} · ${neighborhood}`,
  dayPill: (pets: string, day: number, total: number) => `${pets} aqui · dia ${day} de ${total}`,
  staying: (pets: string, many: boolean, host: string) => `${pets} ${many ? "estão" : "está"} na casa de ${host}`,
  arrived: (pets: string, many: boolean, host: string) => `${pets} ${many ? "chegaram" : "chegou"} na casa de ${host}`,
} as const;
