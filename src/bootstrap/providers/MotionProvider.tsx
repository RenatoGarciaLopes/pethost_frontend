"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Configuração global do Motion: com `prefers-reduced-motion`, deslocamentos e escalas viram corte seco
 * (só a opacidade continua). Loops de ambiente desligam no próprio componente (`usePrefersReducedMotion`).
 *
 * @example <MotionProvider>{children}</MotionProvider>
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
