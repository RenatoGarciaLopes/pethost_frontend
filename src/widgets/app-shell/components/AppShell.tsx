import { Box } from "@mui/material";
import NextLink from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { homeOf } from "@/shared/config/appRoutes";
import { navItemsFor } from "@/shared/config/navigation";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { AccountMenu } from "./client/AccountMenu";
import { HeaderNav } from "./client/HeaderNav";
import { SkipLink } from "./SkipLink";

export interface AppShellProps {
  /** Conta confirmada pela API (`requireRole`, via `RoleGate`), nunca lida do JWT. */
  user: SessionUser;
  children: ReactNode;
}

/**
 * Casca das áreas logadas (spec 004), Server Component: "Pular para o conteúdo", cabeçalho no tom da conta
 * (REQ-SHELL-001: tutor papel, anfitrião gramado claro, admin areia), logo levando à casa do papel, menu da
 * conta, os atalhos do papel (`NAV_ITEMS`; gaveta no celular) e o `<main id="conteudo">`.
 *
 * @example <RoleGate roles="host">{(user) => <AppShell user={user}>{children}</AppShell>}</RoleGate>
 */
export function AppShell({ user, children }: AppShellProps) {
  const navItems = navItemsFor(user.role);
  return (
    <>
      <SkipLink />
      <Box
        component="header"
        data-account={user.role}
        sx={{ height: { xs: 56, md: 64 }, bgcolor: `account.${user.role}`, borderBottom: 2, borderColor: "divider" }}
      >
        <Box
          sx={{
            maxWidth: 1240,
            mx: "auto",
            height: "100%",
            px: { xs: 2, md: 4 },
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
          {navItems.length > 0 && <HeaderNav items={navItems} />}
          <Box sx={{ flexGrow: 1 }} />
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
