import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { GrassFooter } from "@/shared/ui/brand/GrassFooter";
import { AppHeader } from "./AppHeader";

export interface AppShellProps {
  /** Conta confirmada pela API (`requireRole`, via `RoleGate`), nunca lida do JWT. */
  user: SessionUser;
  children: ReactNode;
}

/**
 * Casca das áreas logadas (spec 004), Server Component: "Pular para o conteúdo", cabeçalho no tom da conta
 * (REQ-SHELL-001: tutor papel, anfitrião gramado claro, admin areia), logo levando à casa do papel, menu da
 * conta, os atalhos do papel (`NAV_ITEMS`; gaveta no celular), o `<main id="conteudo">` e o `GrassFooter`
 * (rodapé de gramado que desce para a terra, só desenho).
 *
 * @example <RoleGate roles="host">{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <AppHeader user={user} />
      <Box component="main" id="conteudo" tabIndex={-1} sx={{ outline: "none", flexGrow: 1 }}>
        {children}
      </Box>
      <GrassFooter />
    </Box>
  );
}
