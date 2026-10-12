"use client";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { SPRING_ACOLHER } from "@/shared/theme/tokens/springs";
import { Daisy } from "../Daisy";
import { TurmaWalker } from "../TurmaWalker";

/**
 * Marque o formulário irmão com este atributo (`{...{ [DOOR_TARGET_ATTR]: "" }}`):
 * hover ou foco dentro dele abre a porta.
 */
export const DOOR_TARGET_ATTR = "data-door-target";
/** Marque o botão principal ("Entrar"): no hover/foco dele a porta abre mais e a luz esquenta. */
export const DOOR_WARM_ATTR = "data-door-warm";

export type DoorSceneState = "auto" | "closed" | "open" | "wide";

export interface DoorSceneProps {
  /**
   * `auto` (padrão) reage ao formulário marcado com `DOOR_TARGET_ATTR` na mesma página.
   * Os outros fixam um estado (stories, telas estáticas).
   */
  state?: DoorSceneState;
  /** `lg` ao lado do formulário (computador); `sm` pequena acima do formulário (celular). */
  size?: "lg" | "sm";
  /** Mostra o cachorro da turma passando a cada 16 s (padrão `true` no `lg`). */
  withTurma?: boolean;
}

const respira = keyframes`
  0%, 100% { fill: var(--scene-light); }
  50% { fill: var(--scene-glow); }
`;

const polen = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-46px); opacity: 0; }
`;

const openStyles = {
  "& .scene-leaf": { transform: "scaleX(.55)" },
  "& .scene-beam": { transform: "scaleX(1.25)", opacity: 0.75 },
};
const wideStyles = {
  "& .scene-leaf": { transform: "scaleX(.32)" },
  "& .scene-beam": { transform: "scaleX(1.45)", opacity: 0.95 },
  "& .scene-light": { animation: "none", fill: "var(--scene-glow)" },
};

/**
 * Cena da porta (REQ-DS-015): a porta do logo em tamanho grande, facho de luz no chão, capacho céu
 * com patinha, margaridas, pólen e um cachorro da turma passando. Sempre `aria-hidden`: é ambiente,
 * nunca informação. Fica **fora** do formulário (zero enfeite dentro dele).
 * Com movimento reduzido, tudo para (o CSS global desliga animações e transições).
 *
 * @example
 * <DoorScene />
 * <form {...{ [DOOR_TARGET_ATTR]: "" }}>…<Button {...{ [DOOR_WARM_ATTR]: "" }}>Entrar</Button></form>
 */
export function DoorScene({ state = "auto", size = "lg", withTurma = size === "lg" }: DoorSceneProps) {
  const target = `[${DOOR_TARGET_ATTR}]`;
  const warm = `[${DOOR_WARM_ATTR}]`;

  return (
    <Box
      aria-hidden="true"
      data-state={state}
      sx={(theme) => ({
        position: "relative",
        width: "100%",
        maxWidth: size === "lg" ? 440 : 220,
        mx: size === "sm" ? "auto" : 0,
        pointerEvents: "none",
        userSelect: "none",
        "--scene-ink": theme.palette.quintal.tinta,
        "--scene-leaf": theme.palette.quintal.coral,
        "--scene-light": theme.palette.scene.doorLight,
        "--scene-glow": theme.palette.scene.doorGlow,
        "--scene-mat": theme.palette.ceu.main,
        "--scene-ground": theme.palette.scene.ground,
        "& .scene-leaf": {
          transformBox: "view-box",
          transformOrigin: "244px 180px",
          transition: `transform ${SPRING_ACOLHER.duration}ms ${SPRING_ACOLHER.easing}`,
        },
        "& .scene-beam": {
          transformBox: "fill-box",
          transformOrigin: "50% 0%",
          opacity: 0.55,
          transition: "transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms ease-out",
        },
        "& .scene-light": { animation: `${respira} 3.6s ease-in-out infinite` },
        "& .scene-pollen": { animation: `${polen} 4.2s ease-out infinite` },
        ...(state === "open" && openStyles),
        ...(state === "wide" && wideStyles),
        ...(state === "auto" && {
          [`body:has(${target}:hover) &, body:has(${target}:focus-within) &`]: openStyles,
          [`body:has(${warm}:hover) &, body:has(${warm}:focus-visible) &`]: wideStyles,
        }),
      })}
    >
      <svg viewBox="0 0 360 300" width="100%" style={{ display: "block", overflow: "visible" }} focusable="false">
        {/* chão e facho de luz saindo da porta */}
        <path
          d="M0 228C80 224 150 230 200 227s110-2 160 1V300H0Z"
          fill="var(--scene-ground)"
          stroke="var(--scene-ink)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path className="scene-beam" d="M132 228h96l52 72H80Z" fill="var(--scene-glow)" />

        {/* porta do logo: mesma construção, traço igual na folha e no batente */}
        <g transform="translate(100 60) scale(1.6)">
          <path
            className="scene-light"
            d="M10 104V46A40 40 0 0 1 90 46V104Z"
            fill="var(--scene-light)"
            stroke="var(--scene-ink)"
            strokeWidth="3.9"
            strokeLinejoin="round"
          />
        </g>
        <g className="scene-leaf">
          <g transform="translate(100 60) scale(1.6)">
            <path
              d="M50 104V46A20 40 0 0 1 90 46V104Z"
              fill="var(--scene-leaf)"
              stroke="var(--scene-ink)"
              strokeWidth="3.9"
              strokeLinejoin="round"
            />
            <circle cx="57.5" cy="77" r="3.2" fill="var(--scene-ink)" />
          </g>
        </g>

        {/* capacho céu com patinha */}
        <rect
          x="138"
          y="230"
          width="84"
          height="16"
          rx="8"
          fill="var(--scene-mat)"
          stroke="var(--scene-ink)"
          strokeWidth="3"
        />
        <g fill="var(--scene-ink)">
          <ellipse cx="180" cy="239.5" rx="3.6" ry="2.8" />
          <circle cx="174.5" cy="235" r="1.5" />
          <circle cx="178.5" cy="233.6" r="1.5" />
          <circle cx="182.5" cy="233.6" r="1.5" />
          <circle cx="186.5" cy="235" r="1.5" />
        </g>

        {/* três pontinhos de pólen subindo */}
        {[
          { cx: 92, cy: 196, delay: 0 },
          { cx: 268, cy: 184, delay: 1.4 },
          { cx: 300, cy: 206, delay: 2.8 },
        ].map((dot) => (
          <circle
            key={dot.cx}
            className="scene-pollen"
            cx={dot.cx}
            cy={dot.cy}
            r="3"
            fill="var(--scene-glow)"
            stroke="var(--scene-ink)"
            strokeWidth="1.5"
            style={{ animationDelay: `${dot.delay}s` }}
          />
        ))}
      </svg>

      {/* uma margarida de cada lado da porta */}
      <Box sx={{ position: "absolute", left: "16%", bottom: "23%" }}>
        <Daisy size={size === "lg" ? 60 : 34} petal="branco" />
      </Box>
      <Box sx={{ position: "absolute", right: "15%", bottom: "23%" }}>
        <Daisy size={size === "lg" ? 52 : 30} petal="ceu" delayMs={900} />
      </Box>

      {withTurma ? (
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: "2%" }}>
          <TurmaWalker dogHeight={size === "lg" ? 54 : 32} crossingMs={7000} intervalMs={16000} />
        </Box>
      ) : null}
    </Box>
  );
}
