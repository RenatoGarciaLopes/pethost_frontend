"use client";
import { Box } from "@mui/material";

export interface GroundLineProps {
  /** Altura da faixa em px (padrão 28). A largura ocupa o contêiner. */
  height?: number;
  /** Mostra os tufinhos de grama (padrão `true`). */
  tufts?: boolean;
}

/**
 * Chão do quintal: faixa de grama com contorno de tinta e tufinhos desenhados. Decorativo (`aria-hidden`).
 * Usado embaixo da cena da porta e dos estados vazios. Estica sem distorcer o traço.
 *
 * @example <GroundLine height={24} />
 */
export function GroundLine({ height = 28, tufts = true }: GroundLineProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 400 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      sx={(theme) => ({
        display: "block",
        width: "100%",
        height,
        "--ground": theme.palette.quintal.grama,
        "--ink": theme.palette.quintal.tinta,
      })}
    >
      <path
        d="M0 12C60 9 120 14 200 11s140 3 200 0V28H0Z"
        fill="var(--ground)"
        stroke="var(--ink)"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      {tufts
        ? [36, 118, 214, 296, 372].map((x) => (
            <path
              key={x}
              d={`M${x} 12l3-7m2 7l1-9m3 9l3-6`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))
        : null}
    </Box>
  );
}
