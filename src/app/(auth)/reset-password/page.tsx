import type { Metadata } from "next";
import { passwordCopy } from "@/features/auth";
import { ResetPasswordFlow } from "@/features/auth/index.client";
import { PasswordScreen } from "@/features/auth/index.server";

/** O token chega na URL: nenhum link desta página leva o endereço adiante (REQ-PWD-013). */
export const metadata: Metadata = { title: passwordCopy.reset.pageTitle, referrer: "no-referrer" };

/**
 * `/reset-password` (spec 013). Só a casca: o token é lido no navegador (o fragmento `#token=` nem chega
 * ao servidor) e sai da barra de endereço na primeira renderização (REQ-PWD-005).
 */
export default function ResetPasswordPage() {
  return (
    <PasswordScreen>
      <ResetPasswordFlow />
    </PasswordScreen>
  );
}
