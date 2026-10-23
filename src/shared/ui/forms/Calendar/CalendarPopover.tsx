"use client";
import { Box, Button, Drawer, Popover, useMediaQuery, type Theme } from "@mui/material";
import { useMemo, useState, type ReactNode } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { calendarCopy } from "./calendarCopy";
import { placeCalendar } from "./calendarPlacement";

export interface CalendarPopoverProps {
  open: boolean;
  /** Campo ou célula que abriu o calendário: o popover alinha a borda esquerda a ele. */
  anchorEl: HTMLElement | null;
  /** O que o popover não pode cobrir (a barra inteira); sem ele, o próprio `anchorEl`. */
  clearEl?: HTMLElement | null;
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
export function CalendarPopover({ open, anchorEl, clearEl, onClose, label, children }: CalendarPopoverProps) {
  const compact = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const placement = useMemo(() => {
    const clear = (clearEl ?? anchorEl)?.getBoundingClientRect();
    const align = anchorEl?.getBoundingClientRect();
    return open && clear && align ? placeCalendar(clear, align.left, window.innerHeight) : null;
  }, [open, anchorEl, clearEl]);
  // Na saída o popover segue onde estava, em vez de pular para o topo durante a transição.
  const [lastPlacement, setLastPlacement] = useState(placement);
  if (placement && placement !== lastPlacement) setLastPlacement(placement);
  const where = placement ?? lastPlacement;
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
      anchorReference="anchorPosition"
      anchorPosition={where?.anchorPosition}
      onClose={onClose}
      transformOrigin={{ vertical: where?.edge ?? "top", horizontal: "left" }}
      slotProps={{
        paper: {
          ...paper,
          sx: { ...paper.sx, borderRadius: `${quintalRadii.card}px`, boxShadow: hardShadow(5) },
        },
      }}
    >
      {children({ compact })}
    </Popover>
  );
}
