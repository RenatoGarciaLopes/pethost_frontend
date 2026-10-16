import { PageContainer } from "@/shared/ui/layout/PageContainer";
import type { ReactNode } from "react";
import { AccountSectionNav } from "./client/AccountSectionNav";

/**
 * Casca das páginas de "Minha conta" (spec 015), Server Component: a navegação entre perfil, senha e
 * pausar conta no topo (REQ-ACC-027). Cada tela escolhe seu PageContainer: perfil usa page com duas colunas,
 * senha e confirmação usam reading com Surface. Não cria outro main nem duplica gutters nos filhos.
 *
 * @example <AccountSettingsLayout>{children}</AccountSettingsLayout>
 */
export function AccountSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageContainer width="page" sx={{ pb: 0 }}>
        <AccountSectionNav />
      </PageContainer>
      {children}
    </>
  );
}
