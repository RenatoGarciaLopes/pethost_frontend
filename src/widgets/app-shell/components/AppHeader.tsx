import { Box, Button } from "@mui/material";
import NextLink from "next/link";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { homeOf } from "@/shared/config/appRoutes";
import { navItemsFor, type NavItem } from "@/shared/config/navigation";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { AccountMenu } from "./client/AccountMenu";
import { HeaderNav } from "./client/HeaderNav";
import { SkipLink } from "./SkipLink";

interface AppHeaderProps {
  user?: Pick<SessionUser, "id" | "fullName" | "role" | "avatarUrl"> | null;
  /** Home pública tem atalhos de descoberta; a casca conserva os atalhos de cada papel. */
  variant?: "shell" | "home";
}

const HOW: NavItem = { id: "how", label: "Como funciona", href: "#como-funciona", roles: ["owner", "host"] };
const STAYS: NavItem = { id: "stays", label: "Minhas estadias", href: "/owner/bookings", roles: ["owner"] };

/**
 * Cabeçalho único da casca e da home (REQ-UIC-003): largura page, linha de tinta, marca e menu reais.
 * Sem usuário oferece Entrar; home do tutor oferece estadias. Não consulta sessão nem antecipa Conversas.
 * O caller compõe um único main com id conteudo; a busca de contas só ocorre ao abrir AccountMenu.
 * @example <AppHeader user={user} variant="home" />
 */
export function AppHeader({ user, variant = "shell" }: AppHeaderProps) {
  const home = variant === "home";
  const items = home
    ? user?.role === "owner"
      ? [HOW, STAYS]
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
          height: { xs: 56, md: 64 },
          bgcolor: `account.${user?.role ?? "visitor"}`,
          borderBottom: 2,
          borderColor: "divider",
        }}
      >
        <PageContainer
          width="page"
          sx={{ py: 0, height: "100%", display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}
        >
          <NextLink
            href={home ? "/" : homeOf(user?.role ?? "owner")}
            aria-label="PetHost"
            style={{ display: "inline-flex", flexShrink: 0 }}
          >
            <DoorMark size="header" withWordmark />
          </NextLink>
          <Box sx={{ flexGrow: 1 }} />
          {items.length > 0 && <HeaderNav items={items} />}
          {user ? (
            <AccountMenu user={{ ...user, avatarUrl: user.avatarUrl ?? null }} appearance={home ? "pill" : "avatar"} />
          ) : (
            <Button href="/login" variant="outlined" sx={{ minHeight: 48 }}>
              Entrar
            </Button>
          )}
        </PageContainer>
      </Box>
    </>
  );
}
