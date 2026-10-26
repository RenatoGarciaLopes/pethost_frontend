/**
 * Textos de trocar de conta (spec 014, seção Microcopy). Recebem o nome da conta já pronto
 * ("tutor", "anfitrião", de `roleLabel`), que é neutro de propósito: a API não tem campo de tratamento.
 * O erro da senha que não confere vem de `translateError` (`AUTH_LINKED_ACCOUNT_NOT_FOUND`).
 */
export const switchCopy = {
  pageTitle: "Trocar de conta · PetHost",
  title: "Trocar de conta",
  current: (account: string) => `Você está na conta de ${account}`,
  target: (account: string) => `Entrar na conta de ${account}`,
  password: (account: string) => `Senha da conta de ${account}`,
  passwordHelp: (account: string) => `Cada conta tem a própria senha. Use a da conta de ${account}.`,
  forgot: "Esqueci essa senha",
  submitting: "Trocando…",
  notNow: "Agora não",
  done: (account: string) => `Agora você está na conta de ${account}.`,
  loading: "Buscando suas contas",
  loadError: "Não deu pra ver suas contas agora.",
  missing: (account: string) => `Você ainda não tem conta de ${account}.`,
  create: (account: string) => `Criar conta de ${account}`,
  paused: (account: string) => `Sua conta de ${account} está pausada.`,
  reactivate: "Entrar pra reativar",
} as const;
