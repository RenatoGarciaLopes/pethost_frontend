"use client";

import { Box, Drawer, IconButton, Link, List, ListItem, Stack } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { NavItem } from "@/shared/config/navigation";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { shellCopy } from "../../lib/shellCopy";

/** A página do atalho ou uma de dentro dela (`/pets/123` marca "Meus pets"). */
function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Atalhos do papel (REQ-SHELL-002, 006, 008). No computador, em linha no cabeçalho; abaixo de 900 px, botão
 * que abre a gaveta com os mesmos atalhos (a gaveta do MUI prende o foco, fecha com Esc e devolve o foco ao
 * botão). A página atual leva `aria-current="page"` e contorno de tinta, como na prancha, não só cor.
 *
 * @example <HeaderNav items={navItemsFor(user.role)} />
 */
export function HeaderNav({ items, stayUpdates = false }: { items: readonly NavItem[]; stayUpdates?: boolean }) {
  // Fora do App Router (ex.: Storybook) o caminho pode vir nulo: nenhum atalho fica marcado.
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const activeHref = [...items]
    .filter((item) => matchesPath(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  const links = (onNavigate?: () => void) =>
    items.map((item) => {
      const current = item.href === activeHref;
      const updated = item.id === "owner-stays" && stayUpdates;
      return (
        <ListItem key={item.id} disablePadding sx={{ width: "auto" }}>
          <Link
            component={NextLink}
            href={item.href}
            onClick={onNavigate}
            aria-current={current ? "page" : undefined}
            aria-label={updated ? `${item.label} (${shellCopy.updates})` : undefined}
            underline="none"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1.5,
              minHeight: 44,
              whiteSpace: "nowrap",
              fontWeight: 700,
              color: "text.primary",
              border: "2px solid",
              borderColor: current ? "text.primary" : "transparent",
              borderRadius: `${quintalRadii.control}px`,
              bgcolor: current ? "background.paper" : "transparent",
            }}
          >
            <Box component="span" sx={{ position: "relative" }}>
              {item.label}
              {updated && <UpdateDot top={-3} right={-10} />}
            </Box>
          </Link>
        </ListItem>
      );
    });

  return (
    <>
      <Box component="nav" aria-label={shellCopy.nav} sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
        <Stack component={List} direction="row" spacing={0.5} disablePadding>
          {links()}
        </Stack>
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton
          onClick={() => setOpen(true)}
          aria-label={stayUpdates ? `${shellCopy.openNav} (${shellCopy.updates})` : shellCopy.openNav}
          aria-expanded={open}
          sx={{ width: 48, height: 48 }}
        >
          <Box component="span" aria-hidden sx={{ position: "relative", fontSize: 22, lineHeight: 1 }}>
            ☰{stayUpdates && <UpdateDot top={-2} right={-6} />}
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

/** Novidade nas estadias: coral contornado em tinta (o contorno garante contraste sobre o papel); o nome vem no link. */
function UpdateDot({ top, right }: { top: number; right: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        position: "absolute",
        top,
        right,
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: "quintal.coral",
        border: 1.5,
        borderColor: "text.primary",
      }}
    />
  );
}
