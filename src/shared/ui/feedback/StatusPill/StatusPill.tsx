"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { toneIcon, type FeedbackTone } from "../feedbackIcons";
import { toneSurface } from "../toneStyles";

export type StatusPillTone = FeedbackTone | "neutro";

export interface StatusPillProps {
  /** Texto do status ("Em análise", "Aprovada", "Pausada"). É ele que comunica; a cor só reforça. */
  label: string;
  /** Tom visual. `neutro` não leva ícone. */
  tone?: StatusPillTone;
  /** Tamanho; `sm` para tabelas. */
  size?: "sm" | "md";
}

/** Selo das pranchas: `ok` grama cheio, `info` (espera) céu cheio, `atencao` tracejado, `neutro` contorno de tinta. */
function pillSurface(theme: Theme, tone: StatusPillTone) {
  const ink = `2px solid ${theme.palette.quintal.tinta}`;
  switch (tone) {
    case "neutro":
      return { background: theme.palette.background.paper, border: ink, icon: "" };
    case "ok":
      return { background: theme.palette.grama.main, border: ink, icon: theme.palette.quintal.tinta };
    case "info":
      return { background: theme.palette.ceu.main, border: ink, icon: theme.palette.quintal.tinta };
    default:
      return toneSurface(theme, tone);
  }
}

/**
 * Pílula de status (REQ-DS-014): texto + ícone + cor do tom, do tamanho do texto e sem sombra (não é botão).
 *
 * @example <StatusPill tone="info" label="Em análise" />
 */
export function StatusPill({ label, tone = "neutro", size = "md" }: StatusPillProps) {
  const Icon = tone === "neutro" ? undefined : toneIcon[tone];
  return (
    <Box
      component="span"
      data-tone={tone}
      sx={(theme) => {
        const surface = pillSurface(theme, tone);
        return {
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "flex-start",
          width: "fit-content",
          gap: 0.75,
          borderRadius: `${quintalRadii.pill}px`,
          padding: size === "sm" ? "2px 10px" : "4px 12px",
          fontSize: size === "sm" ? "0.82rem" : "0.9rem",
          fontWeight: 700,
          lineHeight: 1.5,
          whiteSpace: "nowrap",
          color: "text.primary",
          backgroundColor: surface.background,
          border: surface.border,
          "& > svg": { color: surface.icon, width: size === "sm" ? 15 : 17, height: size === "sm" ? 15 : 17 },
        };
      }}
    >
      {Icon ? <Icon /> : null}
      {label}
    </Box>
  );
}
