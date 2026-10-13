"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { Notice } from "@/shared/ui/feedback/Notice";

export interface ErrorNoticeProps {
  /** Frase pronta (de `useErrorNotice`); `null` esconde o aviso. */
  message: string | null;
  tone: "erro" | "atencao";
}

/**
 * Aviso de erro do topo das telas de senha (spec 013). Entra com a mola "assentar" e recebe o foco ao
 * aparecer, para o leitor de tela anunciar e o teclado continuar dali.
 *
 * @example <ErrorNotice message={notice.message} tone={notice.tone} />
 */
export function ErrorNotice({ message, tone }: ErrorNoticeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = message !== null;

  // Só quando aparece: a frase do limite muda a cada segundo e não pode puxar o foco de novo.
  useEffect(() => {
    if (visible) ref.current?.focus();
  }, [visible]);

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="notice"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={MOTION_ASSENTAR}
        >
          <Notice ref={ref} tone={tone}>
            {message}
          </Notice>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
