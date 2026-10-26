import { Container, Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { AccountSectionNav } from "./client/AccountSectionNav";

/**
 * Casca das páginas de "Minha conta" (spec 015), Server Component: a navegação entre perfil, senha e
 * pausar conta no topo (REQ-ACC-027) e o cartão da página embaixo, numa coluna em todas as larguras. Fica dentro
 * do `<main>` da casca (spec 004).
 *
 * @example <AccountSettingsLayout>{children}</AccountSettingsLayout>
 */
export function AccountSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 8 } }}>
      <Stack spacing={3}>
        <AccountSectionNav />
        <Reveal order={0}>
          <Paper sx={{ p: { xs: 2.5, md: 4 } }}>{children}</Paper>
        </Reveal>
      </Stack>
    </Container>
  );
}
