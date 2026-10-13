/**
 * API pública client de auth.
 * Reexporte aqui componentes client e hooks para ilhas interativas.
 * A diretiva use client pertence à implementação, não a este índice.
 * Não exporte recursos server-only.
 */
export { LoginForm } from "./components/client/LoginForm";
export type { LoginFormProps } from "./components/client/LoginForm";
export { useLoginMutation, useReactivateMutation } from "./hooks/useLoginMutation";
export { useSessionStartMutation } from "./hooks/useSessionStartMutation";
export { ForgotPasswordFlow } from "./components/client/ForgotPasswordFlow";
export { ResetPasswordFlow } from "./components/client/ResetPasswordFlow";
