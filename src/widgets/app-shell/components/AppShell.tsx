import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { GrassFooter } from "@/shared/ui/brand/GrassFooter";
import { AppHeader } from "./AppHeader";

export interface AppShellProps {
  /**
   * Conta confirmada pela API (`requireRole`, via `RoleGate`, ou `getSession`), nunca lida do JWT. `null` é o visitante
   * de uma página aberta (o cantinho): cabeçalho sem atalhos, com Entrar.
   */
  user: SessionUser | null;
  children: ReactNode;
  /** Página aberta (o cantinho): o Entrar do visitante volta para ela depois do login. */
  returnTo?: string;
}

/**
 * Casca das áreas logadas (spec 004) e da página aberta do cantinho, Server Component: "Pular para o conteúdo", cabeçalho no tom da conta
 * (REQ-SHELL-001: tutor papel, anfitrião gramado claro, admin areia), logo levando à casa do papel, menu da
 * conta, os atalhos do papel (`NAV_ITEMS`; gaveta no celular), o `<main id="conteudo">` e o `GrassFooter`
 * (rodapé de gramado que desce para a terra, só desenho; fora do admin: orçamento de personalidade zero).
 *
 * @example <RoleGate roles="host">{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>
 */
export function AppShell({ user, children, returnTo }: AppShellProps) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppHeader user={user} returnTo={returnTo} />
      <Box component="main" id="conteudo" tabIndex={-1} sx={{ outline: "none", flexGrow: 1 }}>
        {children}
      </Box>
      {user?.role !== "admin" && <GrassFooter />}
    </Box>
  );
}
