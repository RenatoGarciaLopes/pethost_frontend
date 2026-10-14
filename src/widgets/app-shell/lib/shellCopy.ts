/** Textos da casca do app (spec 004, seção Microcopy). Neutros: a API não tem campo de tratamento. */
export const shellCopy = {
  skipToContent: "Pular para o conteúdo",
  menu: (fullName: string) => `Menu da conta de ${fullName}`,
  myAccount: "Minha conta",
  switchTo: (account: string) => `Trocar pra conta de ${account}`,
  logout: "Sair",
  loggingOut: "Saindo…",
} as const;
