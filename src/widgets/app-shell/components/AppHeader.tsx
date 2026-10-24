import { Box, Button } from "@mui/material";
import NextLink from "next/link";
import type { SessionUser } from "@/shared/auth/contracts/session";
import { homeOf } from "@/shared/config/appRoutes";
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
}

const HOW: NavItem = { id: "how", label: "Como funciona", href: "#como-funciona", roles: ["owner", "host"] };
const STAYS: NavItem = { id: "stays", label: "Minhas estadias", href: "/owner/bookings", roles: ["owner"] };
/** Na home do tutor, além das estadias, as conversas (spec 055): o mesmo item da tabela de atalhos. */
const OWNER_HOME_ITEMS: readonly NavItem[] = [
  HOW,
  STAYS,
  ...navItemsFor("owner").filter((item) => item.id === "conversations"),
];

/**
 * Cabeçalho único da casca e da home (REQ-UIC-003): largura page, linha de tinta, marca e menu reais.
 * Sem usuário oferece Entrar; home do tutor oferece estadias e conversas. Não consulta sessão.
 * O caller compõe um único main com id conteudo; a busca de contas só ocorre ao abrir AccountMenu.
 * @example <AppHeader user={user} variant="home" />
 */
export function AppHeader({ user, variant = "shell" }: AppHeaderProps) {
  const home = variant === "home";
  const items = home
    ? user?.role === "owner"
      ? OWNER_HOME_ITEMS
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
