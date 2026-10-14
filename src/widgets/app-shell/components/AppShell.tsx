import { Box } from "@mui/material";
import NextLink from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { homeOf } from "@/shared/config/appRoutes";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { AccountMenu } from "./client/AccountMenu";
import { SkipLink } from "./SkipLink";

export interface AppShellProps {
  /** Conta confirmada pela API (`requireRole`, via `RoleGate`), nunca lida do JWT. */
  user: SessionUser;
  children: ReactNode;
}

/**
 * Casca das áreas logadas (spec 004), Server Component: "Pular para o conteúdo", cabeçalho no tom da conta
 * (REQ-SHELL-001: tutor papel, anfitrião gramado claro, admin areia), logo levando à casa do papel, menu da
 * conta e o `<main id="conteudo">`. Atalhos de navegação entram com a primeira tela que os tiver (spec 020).
 *
 * @example <RoleGate roles="host">{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <>
      <SkipLink />
      <Box
        component="header"
        data-account={user.role}
        sx={{ bgcolor: `account.${user.role}`, borderBottom: 2, borderColor: "divider" }}
      >
        <Box
          sx={{
            maxWidth: 1240,
            mx: "auto",
            px: { xs: 2, md: 4 },
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* O símbolo fica decorativo: o nome do link é "PetHost", lido uma vez só. `NextLink` direto: um Server
              Component não passa componente (função) como prop para o MUI. */}
          <NextLink href={homeOf(user.role)} aria-label="PetHost" style={{ display: "inline-flex" }}>
            <DoorMark size="header" withWordmark interactive={false} />
          </NextLink>
          <AccountMenu
            user={{ id: user.id, fullName: user.fullName, role: user.role, avatarUrl: user.avatarUrl ?? null }}
          />
        </Box>
      </Box>
      <Box component="main" id="conteudo" tabIndex={-1} sx={{ outline: "none" }}>
        {children}
      </Box>
    </>
  );
}
