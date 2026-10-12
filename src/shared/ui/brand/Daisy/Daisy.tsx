"use client";
import { Box, useTheme } from "@mui/material";
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
 * Desenho da margarida em coordenadas `0 0 40 64` (caule nasce em 20,62), para usar dentro de outro SVG.
 * Quem posiciona e anima é quem usa (ex.: a cena da porta planta flores com ela).
 *
 * @example <g transform="translate(58 182) scale(.77)"><DaisyGlyph petal="ceu" /></g>
 */
export function DaisyGlyph({ petal = "branco" }: { petal?: DaisyPetal }) {
  const { palette } = useTheme();
  const ink = palette.quintal.tinta;
  const petalColor =
    petal === "ceu" ? palette.ceu.main : petal === "coral" ? palette.quintal.coral : palette.background.paper;

  return (
    <>
      <path d="M20 62C20 50 21 38 20 26" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M20 46c4-5 9-6 12-4-3 4-8 6-12 4Z"
        fill={palette.quintal.grama}
        stroke={ink}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="10"
          rx="4.2"
          ry="7"
          transform={`rotate(${angle} 20 18)`}
          fill={petalColor}
          stroke={ink}
          strokeWidth="2.2"
        />
      ))}
      <circle cx="20" cy="18" r="5" fill={palette.quintal.gema} stroke={ink} strokeWidth="2.2" />
    </>
  );
}

/**
 * Margarida neo-brutal (contorno de tinta, miolo gema). Sempre decorativa (`aria-hidden`).
 * Usada no loading e nos estados vazios; a cena da porta desenha a mesma flor com `DaisyGlyph`.
 *
 * @example <Daisy petal="ceu" delayMs={400} />
 */
export function Daisy({ size = 64, petal = "branco", sway = true, delayMs = 0 }: DaisyProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 40 64"
      aria-hidden="true"
      focusable="false"
      sx={{
        width: (size * 40) / 64,
        height: size,
        overflow: "visible",
        "& .daisy-head": {
          transformOrigin: "20px 62px",
          animation: sway ? `${balanca} 3.2s ease-in-out ${delayMs}ms infinite` : "none",
        },
      }}
    >
      <g className="daisy-head">
        <DaisyGlyph petal={petal} />
      </g>
    </Box>
  );
}
