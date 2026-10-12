"use client";
import { Box, type SxProps, type Theme } from "@mui/material";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";

/** Intervalo entre um bloco e o próximo na montagem da tela. */
const STEP_SECONDS = 0.06;

const MotionBox = motion.create(Box);

export interface RevealProps {
  /** Posição na sequência de entrada da tela (0 = primeiro). Cada passo atrasa 60 ms. */
  order?: number;
  /** `below` sobe 12 px enquanto aparece (padrão); `none` só aparece (blocos grandes, cenas). */
  from?: "below" | "none";
  /** Estilo do bloco (ex.: `gridArea`), aplicado no próprio invólucro animado. */
  sx?: SxProps<Theme>;
  children: ReactNode;
}

/**
 * Faz a tela se montar em ordem: cada bloco aparece com a mola "assentar", um depois do outro.
 * Nunca segura a tarefa: o conteúdo já é clicável durante a entrada e tudo assenta em menos de 0,7 s.
 * Com movimento reduzido, só a opacidade anima (MotionProvider).
 * O primeiro quadro já vem do servidor invisível, então não pisca antes de hidratar.
 *
 * @example
 * <Reveal order={0}><Typography variant="h1">Título</Typography></Reveal>
 * <Reveal order={1} sx={{ gridArea: "form" }}><Paper>…</Paper></Reveal>
 */
export function Reveal({ order = 0, from = "below", sx, children }: RevealProps) {
  return (
    <MotionBox
      sx={sx}
      initial={{ opacity: 0, y: from === "below" ? 12 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...MOTION_ASSENTAR, delay: order * STEP_SECONDS }}
    >
      {children}
    </MotionBox>
  );
}
