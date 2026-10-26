"use client";

import { Box, Divider, Drawer, IconButton, Link, List, ListItem, Stack } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import type { NavItem } from "@/shared/config/navigation";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { SPRING_ASSENTAR } from "@/shared/theme/tokens/springs";
import { DoorMark } from "@/shared/ui/brand/DoorMark";
import { shellCopy } from "../../lib/shellCopy";

/** A página do atalho ou uma de dentro dela (`/pets/123` marca "Meus pets"). */
function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Botão redondo de 48 px com contorno de tinta: o do menu e o X da gaveta formam par com o avatar da conta. */
const roundButtonSx = {
  width: 48,
  height: 48,
  color: "text.primary",
  border: "2px solid",
  borderColor: "text.primary",
  borderRadius: `${quintalRadii.pill}px`,
} as const;

/** Ícone desenhado em tinta (traço de 2,4 px, pontas arredondadas), como os de `feedbackIcons`. */
function StrokeIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden
      focusable={false}
    >
      {children}
    </svg>
  );
}

/**
 * Atalhos do papel (REQ-SHELL-002, 006, 008). No computador, em linha no cabeçalho; abaixo de 900 px, botão
 * que abre a gaveta pela direita, do lado do botão (design/16), com a marca, o X de fechar e os mesmos atalhos
 * em linhas grandes. A gaveta do MUI prende o foco, fecha com Esc, no fundo escuro e no X, e devolve o foco ao
 * botão; a mola "assentar" só entra sem `prefers-reduced-motion`. A página atual leva `aria-current="page"`,
 * contorno de tinta e fundo grama, como na prancha, não só cor. A conta (trocar, sair) fica no avatar ao lado.
 *
 * @example <HeaderNav items={navItemsFor(user.role)} />
 */
export function HeaderNav({ items, stayUpdates = false }: { items: readonly NavItem[]; stayUpdates?: boolean }) {
  // Fora do App Router (ex.: Storybook) o caminho pode vir nulo: nenhum atalho fica marcado.
  const pathname = usePathname() ?? "";
  const drawerId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const activeHref = [...items]
    .filter((item) => matchesPath(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  const links = (drawer: boolean) =>
    items.map((item) => {
      const current = item.href === activeHref;
      const updated = item.id === "owner-stays" && stayUpdates;
      return (
        <ListItem key={item.id} disablePadding sx={{ width: drawer ? "100%" : "auto" }}>
          <Link
            component={NextLink}
            href={item.href}
            onClick={drawer ? () => setOpen(false) : undefined}
            aria-current={current ? "page" : undefined}
            aria-label={updated ? `${item.label} (${shellCopy.updates})` : undefined}
            underline="none"
            sx={{
              display: drawer ? "flex" : "inline-flex",
              alignItems: "center",
              width: drawer ? "100%" : undefined,
              px: drawer ? 2 : 1.5,
              minHeight: drawer ? 56 : 44,
              whiteSpace: "nowrap",
              fontWeight: 700,
              fontSize: drawer ? "1.0625rem" : undefined,
              color: "text.primary",
              border: "2px solid",
              borderColor: current ? "text.primary" : "transparent",
              borderRadius: `${quintalRadii.control}px`,
              bgcolor: current ? (drawer ? "quintal.grama" : "background.paper") : "transparent",
              ...(drawer && !current && { "&:hover": { bgcolor: "action.hover" } }),
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
          {links(false)}
        </Stack>
      </Box>
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <IconButton
          onClick={() => setOpen(true)}
          aria-label={stayUpdates ? `${shellCopy.openNav} (${shellCopy.updates})` : shellCopy.openNav}
          aria-expanded={open}
          aria-controls={open ? drawerId : undefined}
          sx={roundButtonSx}
        >
          <Box component="span" sx={{ position: "relative", display: "inline-flex" }}>
            <StrokeIcon>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </StrokeIcon>
            {stayUpdates && <UpdateDot top={-3} right={-5} />}
          </Box>
        </IconButton>
        <Drawer
          id={drawerId}
          anchor="right"
          open={open}
          onClose={() => setOpen(false)}
          transitionDuration={reducedMotion ? 0 : { enter: SPRING_ASSENTAR.duration, exit: 200 }}
          slotProps={{
            transition: { easing: { enter: SPRING_ASSENTAR.easing, exit: "ease-in" } },
            paper: {
              "aria-label": shellCopy.nav,
              sx: {
                width: "min(85vw, 320px)",
                bgcolor: "background.paper",
                backgroundImage: "none",
                boxShadow: "none",
                borderRadius: 0,
                borderLeft: "2px solid",
                borderColor: "text.primary",
              },
            },
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, minHeight: 74 }}
          >
            <DoorMark size="header" withWordmark />
            <IconButton onClick={() => setOpen(false)} aria-label={shellCopy.closeNav} autoFocus sx={roundButtonSx}>
              <StrokeIcon>
                <path d="M6 6l12 12M18 6L6 18" />
              </StrokeIcon>
            </IconButton>
          </Stack>
          <Divider sx={{ borderColor: "text.primary", borderBottomWidth: 2 }} />
          <Box component="nav" aria-label={shellCopy.nav} sx={{ p: 2 }}>
            <Stack component={List} spacing={0.5} disablePadding>
              {links(true)}
            </Stack>
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
