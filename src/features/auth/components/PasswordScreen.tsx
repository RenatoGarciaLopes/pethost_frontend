import { Container, Paper } from "@mui/material";
import type { ReactNode } from "react";
import { Reveal } from "@/shared/ui/motion/Reveal";

/**
 * Casca das telas de senha (spec 013), Server Component: uma coluna estreita e centralizada em todas as
 * larguras, com o cartão assentando ao abrir. O conteúdo é a ilha client da etapa.
 *
 * @example <PasswordScreen><ResetPasswordFlow /></PasswordScreen>
 */
export function PasswordScreen({ children }: { children: ReactNode }) {
  return (
    <Container component="main" id="conteudo" maxWidth="sm" sx={{ py: { xs: 3, md: 10 } }}>
      <Reveal order={0}>
        <Paper sx={{ p: { xs: 2.5, md: 4 } }}>{children}</Paper>
      </Reveal>
    </Container>
  );
}
