import { Box, Button } from "@mui/material";
import type { ReactNode } from "react";
import NextLink from "next/link";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { homeOf, loginRedirectPath } from "@/shared/config/appRoutes";
import { navItemsFor, type NavItem } from "@/shared/config/navigation";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { AccountMenu } from "./client/AccountMenu";
import { HeaderNav } from "./client/HeaderNav";
import { SkipLink } from "./SkipLink";

interface AppHeaderProps {
  user?: Pick<SessionUser, "id" | "fullName" | "role" | "avatarUrl"> | null;
  /** Home pública tem atalhos de descoberta; a casca conserva os atalhos de cada papel. */
  variant?: "shell" | "home";
  /** Busca minificada no centro do cabeçalho (resultados da home); some sozinha quando não há busca. */
  search?: ReactNode;
  /** Faixa própria abaixo da linha principal, ainda acima da borda do cabeçalho (chips dos resultados). */
  filters?: ReactNode;
  /** Página aberta de onde o visitante sai para entrar: o login volta para ela. */
  returnTo?: string;
}

const HOW: NavItem = { id: "how", label: "Como funciona", href: "#como-funciona", roles: ["owner", "host"] };
/** Na home o tutor já tem a busca na faixa principal: o cabeçalho só leva às estadias. */
const HOME_OWNER_ITEMS = navItemsFor("owner").filter((item) => item.id === "owner-stays");

/**
 * Cabeçalho único da casca e da home (REQ-UIC-003): largura page, linha de tinta, marca, atalhos do papel à
 * direita e a pílula da conta com avatar e primeiro nome. Sem usuário oferece Entrar. Não consulta sessão nem
 * antecipa Conversas. O caller compõe um único main com id conteudo; a busca de contas só ocorre ao abrir
 * AccountMenu.
 * @example <AppHeader user={user} variant="home" />
 */
export function AppHeader({ user, variant = "shell", search, filters, returnTo }: AppHeaderProps) {
  const home = variant === "home";
  const items = home
    ? user?.role === "owner"
      ? [HOW, ...HOME_OWNER_ITEMS]
      : [HOW, ...(user ? navItemsFor(user.role) : [])]
    : user
      ? navItemsFor(user.role)
      : [];
  return (
    <>
      <SkipLink />
      <Box
        component="header"
        data-account={user?.role ?? "visitor"}
        sx={{
          minHeight: { xs: 74, md: 80 },
          bgcolor: `account.${user?.role ?? "visitor"}`,
          borderBottom: 2,
          borderColor: "text.primary",
        }}
      >
        <PageContainer
          width="page"
          sx={{
            py: { xs: 1.5, md: 1.5 },
            minHeight: "inherit",
            display: "flex",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
            gap: { xs: 1, md: 2 },
          }}
        >
          <NextLink
            href={home ? "/" : homeOf(user?.role ?? "owner")}
            aria-label="PetHost"
            style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none", color: quintalColors.tinta }}
          >
            <DoorMark size="header" withWordmark />
          </NextLink>
          <Box sx={{ flexGrow: 1 }} />
          {search}
          {search && <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }} />}
          {items.length > 0 && <HeaderNav items={items} />}
          {user ? (
            <AccountMenu user={{ ...user, avatarUrl: user.avatarUrl ?? null }} />
          ) : (
            <Button href={loginRedirectPath(returnTo)} variant="outlined" sx={{ minHeight: 48 }}>
              Entrar
            </Button>
          )}
        </PageContainer>
        {filters}
      </Box>
    </>
  );
}
