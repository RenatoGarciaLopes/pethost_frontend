"use client";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import type { ReactNode } from "react";
import { SPRING_ACOLHER } from "@/shared/theme/tokens/springs";

export interface CelebrationProps {
  /** O momento comemorado (ex.: título "Prazer, Pipoca!"). Fica sempre visível e legível. */
  children: ReactNode;
  /** Toca a comemoração. Trocar `playKey` repete (ex.: id do pet recém-criado). */
  playKey?: string | number;
  /** Chamado quando a explosão de pólen termina (uma vez por `playKey`). */
  onDone?: () => void;
}

const SPARKS = 10;
const BURST_MS = 900;

const estoura = keyframes`
  0% { transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(.4); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(var(--spark-reach)) scale(1); opacity: 0; }
`;

const acolhe = keyframes`
  0% { transform: scale(.86); }
  100% { transform: scale(1); }
`;

/**
 * Comemoração de marco (REQ-DS-016): o conteúdo entra com a mola "acolher" e uma explosão de pólen
 * nas cores da paleta toca **uma vez**. Nunca bloqueia clique e não anuncia nada a mais para leitor de tela
 * (o texto do momento já é o conteúdo). Com movimento reduzido, só o conteúdo aparece, parado.
 *
 * @example <Celebration playKey={pet.id}><Typography variant="h1">Prazer, {pet.name}!</Typography></Celebration>
 */
export function Celebration({ children, playKey = 0, onDone }: CelebrationProps) {
  return (
    <Box
      key={playKey}
      sx={(theme) => ({
        position: "relative",
        display: "inline-block",
        "--spark-a": theme.palette.quintal.gema,
        "--spark-b": theme.palette.ceu.main,
        "--spark-c": theme.palette.quintal.coral,
        "--spark-d": theme.palette.quintal.grama,
        "--spark-ink": theme.palette.quintal.tinta,
      })}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          animation: `${acolhe} ${SPRING_ACOLHER.duration}ms ${SPRING_ACOLHER.easing} both`,
        }}
      >
        {children}
      </Box>
      <Box aria-hidden="true" sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {Array.from({ length: SPARKS }, (_, index) => (
          <Box
            key={index}
            onAnimationEnd={index === SPARKS - 1 ? onDone : undefined}
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: index % 3 === 0 ? 12 : 9,
              height: index % 3 === 0 ? 12 : 9,
              borderRadius: "50%",
              border: "2px solid var(--spark-ink)",
              backgroundColor: `var(--spark-${"abcd"[index % 4]})`,
              opacity: 0,
              "--spark-angle": `${(360 / SPARKS) * index}deg`,
              "--spark-reach": `${-70 - (index % 3) * 18}px`,
              animation: `${estoura} ${BURST_MS}ms cubic-bezier(.2,.7,.2,1) ${120 + (index % 2) * 60}ms 1 both`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
