"use client";
import { Box } from "@mui/material";
import { SPRING_ACOLHER } from "@/shared/theme/tokens/springs";

export type StickerColor = "gema" | "grama" | "ceu";

export interface StickerProps {
  /** Texto do adesivo ("Vizinho", "Novo por aqui"). Curto. */
  label: string;
  /** Cor de fundo (paleta Quintal). Padrão `gema`. */
  color?: StickerColor;
  /** Inclinação em graus (padrão 4). */
  tilt?: number;
  /** Reage ao hover com a mola "acolher" (gira para -5° e cresce 8%). Padrão `true`. */
  playful?: boolean;
}

/**
 * Adesivo da marca (REQ-DS-014): Caprasimo, contorno de tinta, levemente torto.
 * É personalidade (vault: orçamento de personalidade); use com parcimônia, um por card.
 *
 * @example <Sticker label="Vizinho" color="grama" />
 */
export function Sticker({ label, color = "gema", tilt = 4, playful = true }: StickerProps) {
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-block",
        fontFamily: theme.typography.h1.fontFamily,
        fontSize: "0.95rem",
        lineHeight: 1.2,
        padding: "5px 12px 6px",
        color: "text.primary",
        backgroundColor: theme.palette[color].main,
        border: `2px solid ${theme.palette.quintal.tinta}`,
        borderRadius: 999,
        boxShadow: `2px 2px 0 ${theme.palette.quintal.tinta}`,
        transform: `rotate(${tilt}deg)`,
        transition: `transform ${SPRING_ACOLHER.duration}ms ${SPRING_ACOLHER.easing}`,
        ...(playful && { "&:hover": { transform: "rotate(-5deg) scale(1.08)" } }),
      })}
    >
      {label}
    </Box>
  );
}
