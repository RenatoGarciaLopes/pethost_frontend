import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { Surface } from "@/shared/ui/layout/Surface";

import type { ReactNode } from "react";
import { Reveal } from "@/shared/ui/motion/Reveal";

/**
 * Casca das telas de senha (spec 013), Server Component: uma coluna estreita e centralizada em todas as
 * larguras, com o cartão assentando ao abrir. O conteúdo é a ilha client da etapa.
 *
 * @example <PasswordScreen><ResetPasswordFlow /></PasswordScreen>
 * @example <PasswordScreen inShell><AccountSwitchPanel … /></PasswordScreen>
 */
export function PasswordScreen({ children, inShell = false }: { children: ReactNode; inShell?: boolean }) {
  // Dentro da casca (spec 004) o `<main id="conteudo">` é dela; fora (telas de entrada), é desta tela.
  const landmark = inShell ? {} : ({ component: "main", id: "conteudo" } as const);
  return (
    <PageContainer {...landmark} width="reading">
      <Reveal order={0}>
        <Surface elevation="md" sx={{ p: { xs: 2.5, md: 4 } }}>
          {children}
        </Surface>
      </Reveal>
    </PageContainer>
  );
}
