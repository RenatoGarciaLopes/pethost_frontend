"use client";
import { Box } from "@mui/material";
import { SPRING_ACOLHER } from "@/shared/theme/tokens/springs";

export type DoorMarkSize = "header" | "large";

export interface DoorMarkProps {
  /**
   * Tamanho de uso, que define o traço (vault `marca/04-logo.md`: o traço engorda quando encolhe).
   * `header`: 40 × 44 px, traço 8. `large`: ~170 px, traço 6. Padrão `header`.
   */
  size?: DoorMarkSize;
  /** Largura em px; sobrescreve a do tamanho (a altura segue a proporção 100 × 110). */
  width?: number;
  /** Mostra "pethost" em Caprasimo ao lado (assinatura). */
  withWordmark?: boolean;
  /**
   * Nome acessível. Sem ele, o símbolo é decorativo (`aria-hidden`), como quando já está dentro
   * de um link com texto. Com `withWordmark`, o texto visível já nomeia a marca.
   */
  title?: string;
  /** Abre a folha e acende a luz no hover/foco do próprio símbolo ou do link pai (padrão `true`). */
  interactive?: boolean;
}

const sizes: Record<DoorMarkSize, { width: number; stroke: number; knob: number }> = {
  header: { width: 40, stroke: 8, knob: 4.5 },
  large: { width: 170, stroke: 6, knob: 4 },
};

/**
 * Logo da PetHost: a porta em arco entreaberta com a luz acesa. Só a porta: **nunca** bicho dentro,
 * sem chão, sem fresta escura, folha coral sempre (não troca com o tema).
 * No hover/foco a folha abre (`scaleX(.55)`, mola "acolher") e a luz esquenta.
 *
 * @example
 * <Link href="/" aria-label="PetHost, início"><DoorMark withWordmark /></Link>
 * <DoorMark size="large" title="PetHost" />
 */
export function DoorMark({ size = "header", width, withWordmark = false, title, interactive = true }: DoorMarkProps) {
  const spec = sizes[size];
  const symbolWidth = width ?? spec.width;
  const decorative = !title;
  const open = {
    "& .door-leaf": { transform: "scaleX(.55)" },
    "& .door-light": { fill: "var(--door-glow)" },
  };

  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: `${Math.round(symbolWidth * 0.28)}px`,
        "--door-ink": theme.palette.quintal.tinta,
        "--door-leaf": theme.palette.quintal.coral,
        "--door-light": theme.palette.scene.doorLight,
        "--door-glow": theme.palette.scene.doorGlow,
        "& .door-leaf": {
          transformOrigin: "90px 75px",
          transition: `transform 500ms ${SPRING_ACOLHER.easing}`,
        },
        "& .door-light": { transition: "fill .4s ease-out" },
        ...(interactive && { "&:hover": open, "a:hover > &, a:focus-visible > &": open }),
      })}
    >
      <svg
        viewBox="0 0 100 110"
        width={symbolWidth}
        height={(symbolWidth * 110) / 100}
        role={decorative ? undefined : "img"}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : title}
        focusable="false"
        overflow="visible"
      >
        <path
          className="door-light"
          d="M10 104V46A40 40 0 0 1 90 46V104Z"
          fill="var(--door-light)"
          stroke="var(--door-ink)"
          strokeWidth={spec.stroke}
          strokeLinejoin="round"
        />
        <g className="door-leaf">
          <path
            d="M50 104V46A20 40 0 0 1 90 46V104Z"
            fill="var(--door-leaf)"
            stroke="var(--door-ink)"
            strokeWidth={spec.stroke}
            strokeLinejoin="round"
          />
          <circle cx="57.5" cy="77" r={spec.knob} fill="var(--door-ink)" />
        </g>
      </svg>
      {withWordmark ? (
        <Box
          component="span"
          sx={(theme) => ({
            fontFamily: theme.typography.h1.fontFamily,
            fontSize: `${Math.round(symbolWidth * 0.78)}px`,
            lineHeight: 1,
            color: "text.primary",
            letterSpacing: "-0.01em",
          })}
        >
          pethost
        </Box>
      ) : null}
    </Box>
  );
}
