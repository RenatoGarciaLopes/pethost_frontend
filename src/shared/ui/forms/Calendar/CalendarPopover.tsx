"use client";
import { Box, Button, Drawer, Popover, useMediaQuery, type Theme } from "@mui/material";
import type { ReactNode } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { calendarCopy } from "./calendarCopy";

export interface CalendarPopoverProps {
  open: boolean;
  /** Campo que abriu o calendário; Esc e o fechamento devolvem o foco a ele. */
  anchorEl: HTMLElement | null;
  onClose: () => void;
  /** Nome do diálogo para leitor de tela. */
  label: string;
  /** Recebe `compact` no celular, onde o calendário vira folha de baixo com um mês só. */
  children: (layout: { compact: boolean }) => ReactNode;
}

/**
 * Casca do calendário dos campos de data: popover contornado no desktop, folha de baixo com "Pronto" no celular.
 *
 * @example <CalendarPopover open={open} anchorEl={anchor} onClose={close} label="Escolher a data">{({ compact }) => <Calendar … />}</CalendarPopover>
 */
export function CalendarPopover({ open, anchorEl, onClose, label, children }: CalendarPopoverProps) {
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const paper = {
    role: "dialog",
    "aria-label": label,
    sx: {
      bgcolor: "background.paper",
      backgroundImage: "none",
      border: "2px solid",
      borderColor: "text.primary",
      overflow: "visible",
    },
  };
  if (compact) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            ...paper,
            sx: {
              ...paper.sx,
              borderBottom: 0,
              borderRadius: `${quintalRadii.card}px ${quintalRadii.card}px 0 0`,
              maxHeight: "92dvh",
              overflow: "auto",
            },
          },
        }}
      >
        {children({ compact })}
        <Box sx={{ px: 1.5, pb: 2 }}>
          <Button fullWidth variant="contained" onClick={onClose} sx={{ minHeight: 48 }}>
            {calendarCopy.done}
          </Button>
        </Box>
      </Drawer>
    );
  }
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          ...paper,
          sx: { ...paper.sx, mt: 1, borderRadius: `${quintalRadii.card}px`, boxShadow: hardShadow(5) },
        },
      }}
    >
      {children({ compact })}
    </Popover>
  );
}
