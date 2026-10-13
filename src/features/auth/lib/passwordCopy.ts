import type { PersonalRole } from "@/shared/auth/contracts/session";

/**
 * Textos de esqueci e troquei a senha (spec 013, seção Microcopy). Erros vindos da API não ficam aqui:
 * a frase de cada código vem de `getErrorMessage` (`shared/api/errors/errorCopy.ts`).
 */
export const passwordCopy = {
  forgot: {
    pageTitle: "Esqueci a senha · PetHost",
    title: "Esqueceu a senha? Acontece.",
    roleLabel: "Sua conta é de",
    roles: { owner: "Tutor", host: "Anfitrião" } satisfies Record<PersonalRole, string>,
    email: "E-mail da conta",
    submit: "Mandar o link",
    submitting: "Mandando…",
  },
  sent: {
    title: "Olha seu e-mail",
    body: "Se existir uma conta com esse e-mail, o link chega em instantes. Ele vale 30 minutos.",
    spam: "Não chegou? Confere o spam",
    resendIn: (seconds: number) => `ou manda de novo em ${seconds} s.`,
    resendNow: "ou manda de novo.",
    resend: "Mandar de novo",
    resending: "Mandando…",
    otherEmail: "Usar outro e-mail",
    onlyNewest: "Vale só o link mais novo.",
  },
  reset: {
    pageTitle: "Senha nova · PetHost",
    title: "Cria uma senha nova",
    password: "Senha nova",
    submit: "Guardar senha nova",
    submitting: "Guardando…",
    incomplete: "Esse link está incompleto. Pede um novo, leva um minuto.",
    expired: "Esse link já venceu. Pede outro, leva um minuto.",
    requestNew: "Pedir um link novo",
  },
  done: {
    title: "Senha nova guardada",
    body: "Por segurança, saímos da sua conta em todos os aparelhos.",
    login: "Entrar",
  },
  countdown: (seconds: number) => `Dá pra tentar de novo em ${seconds} ${seconds === 1 ? "segundo" : "segundos"}.`,
} as const;
