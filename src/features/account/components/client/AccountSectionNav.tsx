"use client";

import { Box, Link, Stack } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { accountCopy } from "../../lib/accountCopy";

/** As três páginas de "Minha conta", na ordem do menu (REQ-ACC-027). */
const ACCOUNT_SECTIONS = [
  { href: "/users/profile", label: accountCopy.nav.profile },
  { href: "/users/password", label: accountCopy.nav.password },
  { href: "/users/deactivate", label: accountCopy.nav.deactivate },
] as const;

/**
 * Navegação entre perfil, senha e pausar conta (REQ-ACC-027). A página aberta leva `aria-current="page"`
 * e um sublinhado grosso; a diferença não depende só de cor. No celular a linha rola de lado.
 *
 * @example <AccountSectionNav />
 */
export function AccountSectionNav() {
  const pathname = usePathname();

  return (
    <Box component="nav" aria-label={accountCopy.nav.label} sx={{ overflowX: "auto" }}>
      <Stack component="ul" direction="row" spacing={3} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {ACCOUNT_SECTIONS.map(({ href, label }) => {
          const current = pathname === href;
          return (
            <Box component="li" key={href} sx={{ flexShrink: 0 }}>
              <Link
                component={NextLink}
                href={href}
                aria-current={current ? "page" : undefined}
                underline="none"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 48,
                  py: 1,
                  fontWeight: current ? 700 : 400,
                  color: current ? "text.primary" : "text.secondary",
                  borderBottom: 3,
                  borderColor: current ? "primary.main" : "transparent",
                }}
              >
                {label}
              </Link>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
