"use client";

import { Box, Drawer, IconButton, Link, List, ListItem, Stack } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/shared/config/navigation";
import { shellCopy } from "../../lib/shellCopy";

/** A página do atalho ou uma de dentro dela (`/pets/123` marca "Meus pets"). */
function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Atalhos do papel (REQ-SHELL-002, 006, 008). No computador, em linha no cabeçalho; abaixo de 900 px, botão
 * que abre a gaveta com os mesmos atalhos (a gaveta do MUI prende o foco, fecha com Esc e devolve o foco ao
 * botão). A página atual leva `aria-current="page"` e sublinhado grosso, não só cor.
 *
 * @example <HeaderNav items={navItemsFor(user.role)} />
 */
export function HeaderNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (onNavigate?: () => void) =>
    items.map((item) => {
      const current = isCurrent(pathname, item.href);
      return (
        <ListItem key={item.id} disablePadding sx={{ width: "auto" }}>
          <Link
            component={NextLink}
            href={item.href}
            onClick={onNavigate}
            aria-current={current ? "page" : undefined}
            underline="none"
            sx={{
              display: "inline-block",
              px: 1,
              py: 1.25,
              minHeight: 44,
              fontWeight: current ? 700 : 400,
              color: "text.primary",
              borderBottom: 3,
              borderColor: current ? "primary.main" : "transparent",
            }}
          >
            {item.label}
          </Link>
        </ListItem>
      );
    });

  return (
    <>
      <Box component="nav" aria-label={shellCopy.nav} sx={{ display: { xs: "none", md: "block" } }}>
        <Stack component={List} direction="row" spacing={2} disablePadding>
          {links()}
        </Stack>
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton
          onClick={() => setOpen(true)}
          aria-label={shellCopy.openNav}
          aria-expanded={open}
          sx={{ width: 44, height: 44 }}
        >
          <Box component="span" aria-hidden sx={{ fontSize: 22, lineHeight: 1 }}>
            ☰
          </Box>
        </IconButton>
        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
          <Box component="nav" aria-label={shellCopy.nav} sx={{ width: 260, p: 2 }}>
            <List>{links(() => setOpen(false))}</List>
          </Box>
        </Drawer>
      </Box>
    </>
  );
}
