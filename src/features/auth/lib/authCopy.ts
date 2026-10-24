import type { LoginNotice } from "@/shared/config/appRoutes";
import type { PersonalRole } from "@/shared/auth/contracts/session";

/**
 * Textos da tela de entrar (spec 010, seção Microcopy). Erros vindos da API não ficam aqui:
 * a frase de cada código vem de `translateError` (`shared/api/errors/translateError.ts`).
 */
export const authCopy = {
  title: "Entra que a porta tá aberta",
  greeting: "Que bom te ver",
  adminTitle: "Entrada da equipe",
  roleLabel: "Você entra como",
  roles: {
    owner: { label: "Sou tutor", help: "Conta de quem tem pet e vai viajar." },
    host: { label: "Sou anfitrião", help: "Conta de quem recebe pets em casa. Tem senha própria." },
  } satisfies Record<PersonalRole, { label: string; help: string }>,
  email: "E-mail",
  password: "Senha",
  submit: "Entrar",
  submitting: "Entrando…",
  forgotPassword: "Esqueci a senha",
  noAccount: "Ainda não tem conta?",
  register: "Criar conta",
  reactivate: "Reativar minha conta",
  reactivating: "Reativando…",
  support: "Falar com o suporte",
  countdown: (seconds: number) => `Dá pra tentar de novo em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
  fieldErrors: {
    emailMissing: "Falta o e-mail.",
    emailInvalid: "Esse e-mail parece incompleto.",
    passwordMissing: "Falta a senha.",
    passwordWeak: "A senha ainda não cumpre a régua.",
    passwordTooLong: "Essa senha passou do tamanho que a gente aceita.",
  },
  trust: ["Conversa antes de fechar", "Foto todo dia", "Pagamento guardado"],
  /** Avisos fixos que chegam pela chave `?aviso=` (nunca texto da URL). */
  notices: { "conta-pausada": "Sua conta está pausada. Quando quiser voltar, é só entrar." } satisfies Record<
    LoginNotice,
    string
  >,
} as const;
