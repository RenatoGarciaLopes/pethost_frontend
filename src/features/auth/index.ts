/**
 * API pública neutra de auth.
 * Exporte aqui tipos, schemas e funções puras compartilháveis entre ambientes.
 * Não exporte hooks, componentes client ou recursos exclusivos do servidor.
 */
export { loginFormSchema } from "./schemas/loginFormSchema";
export type { LoginFormInput, LoginFormValues } from "./schemas/loginFormSchema";
export { authCopy } from "./lib/authCopy";
export { passwordCopy } from "./lib/passwordCopy";
export { resolveSwitchTarget } from "./lib/resolveSwitchTarget";
export { switchCopy } from "./lib/switchCopy";
