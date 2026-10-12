"use client";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { TURMA_ASPECT, TURMA_MEMBERS, type TurmaMember } from "../turma";
import { TurmaDog } from "./TurmaDog";

export interface TurmaWalkerProps {
  /** Quem desfila, na ordem. Padrão: corgi, golden e pastor. */
  members?: readonly TurmaMember[];
  /** Altura de cada cachorro em px (padrão 84). */
  dogHeight?: number;
  /** Tempo de uma travessia, da esquerda para a direita (padrão 6000 ms). */
  crossingMs?: number;
  /**
   * Intervalo entre a saída de um cachorro e a do próximo (padrão = `crossingMs`, um por vez).
   * Ex.: na cena do login, um cachorro passa a cada 16 s (`crossingMs` 6000, `intervalMs` 16000).
   */
  intervalMs?: number;
  /** `loop` (padrão) repete para sempre; `once` faz cada cachorro passar uma vez e para. */
  repeat?: "loop" | "once";
}

/**
 * Desfile da turma por uma pista que ocupa a largura do contêiner (REQ-DS-016).
 * Nunca bloqueia clique (`pointer-events: none`) e é decorativo. Com movimento reduzido,
 * os cachorros ficam parados lado a lado na pista.
 *
 * @example <TurmaWalker crossingMs={6000} intervalMs={16000} dogHeight={72} />
 */
export function TurmaWalker({
  members = TURMA_MEMBERS,
  dogHeight = 84,
  crossingMs = 6000,
  intervalMs = crossingMs,
  repeat = "loop",
}: TurmaWalkerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const dogWidth = Math.round(dogHeight * TURMA_ASPECT);
  const period = Math.max(intervalMs * members.length, crossingMs);
  const walkEnd = (crossingMs / period) * 100;
  const walk = keyframes`
    0% { left: -${dogWidth}px; visibility: visible; }
    ${walkEnd}% { left: 100%; visibility: visible; }
    ${Math.min(walkEnd + 0.01, 100)}%, 100% { left: 100%; visibility: hidden; }
  `;

  return (
    <Box
      aria-hidden="true"
      sx={{ position: "relative", width: "100%", height: dogHeight, overflow: "hidden", pointerEvents: "none" }}
    >
      {members.map((member, index) => (
        <Box
          key={`${member}-${index}`}
          sx={
            reducedMotion
              ? {
                  position: "absolute",
                  bottom: 0,
                  left: `calc(${((index + 1) * 100) / (members.length + 1)}% - ${dogWidth / 2}px)`,
                }
              : {
                  position: "absolute",
                  bottom: 0,
                  left: -dogWidth,
                  visibility: "hidden",
                  animation: `${walk} ${period}ms linear ${index * intervalMs}ms ${repeat === "loop" ? "infinite" : 1} both`,
                }
          }
        >
          <TurmaDog member={member} height={dogHeight} still={reducedMotion} />
        </Box>
      ))}
    </Box>
  );
}
