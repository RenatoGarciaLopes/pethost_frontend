"use client";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

export type DaisyPetal = "branco" | "ceu" | "coral";

export interface DaisyProps {
  /** Altura em px (a largura acompanha). Padrão 64. */
  size?: number;
  /** Cor das pétalas. Padrão `branco`. */
  petal?: DaisyPetal;
  /** Balança devagar (padrão `true`). Desliga sozinho com movimento reduzido (CSS global). */
  sway?: boolean;
  /** Atraso do balanço, para flores vizinhas não andarem juntas. */
  delayMs?: number;
}

const balanca = keyframes`
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(5deg); }
`;

/**
 * Margarida neo-brutal (contorno de tinta, miolo gema). Sempre decorativa (`aria-hidden`).
 * Usada na cena da porta, no loading e nos estados vazios.
 *
 * @example <Daisy petal="ceu" delayMs={400} />
 */
export function Daisy({ size = 64, petal = "branco", sway = true, delayMs = 0 }: DaisyProps) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Box
      component="svg"
      viewBox="0 0 40 64"
      aria-hidden="true"
      focusable="false"
      sx={(theme) => {
        const petalColor =
          petal === "ceu"
            ? theme.palette.ceu.main
            : petal === "coral"
              ? theme.palette.quintal.coral
              : theme.palette.background.paper;
        return {
          width: (size * 40) / 64,
          height: size,
          overflow: "visible",
          "--daisy-petal": petalColor,
          "--daisy-ink": theme.palette.quintal.tinta,
          "--daisy-core": theme.palette.quintal.gema,
          "--daisy-stem": theme.palette.quintal.grama,
          "& .daisy-head": {
            transformOrigin: "20px 62px",
            animation: sway ? `${balanca} 3.2s ease-in-out ${delayMs}ms infinite` : "none",
          },
        };
      }}
    >
      <g className="daisy-head">
        <path
          d="M20 62C20 50 21 38 20 26"
          fill="none"
          stroke="var(--daisy-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M20 46c4-5 9-6 12-4-3 4-8 6-12 4Z"
          fill="var(--daisy-stem)"
          stroke="var(--daisy-ink)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {petals.map((angle) => (
          <ellipse
            key={angle}
            cx="20"
            cy="10"
            rx="4.2"
            ry="7"
            transform={`rotate(${angle} 20 18)`}
            fill="var(--daisy-petal)"
            stroke="var(--daisy-ink)"
            strokeWidth="2.2"
          />
        ))}
        <circle cx="20" cy="18" r="5" fill="var(--daisy-core)" stroke="var(--daisy-ink)" strokeWidth="2.2" />
      </g>
    </Box>
  );
}
