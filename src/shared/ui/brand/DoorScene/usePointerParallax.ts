"use client";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect } from "react";

/** Mola suave do parallax: segue o mouse com atraso, sem tremer. */
const FOLLOW = { stiffness: 60, damping: 18, mass: 0.6 };

/**
 * Posição do mouse na janela, de -1 a 1 em cada eixo, suavizada. Só liga com mouse de verdade
 * (`pointer: fine`): no toque, a cena fica parada. Desligado, volta ao centro.
 *
 * @example const pointer = usePointerParallax(!reducedMotion); useTransform(pointer.x, (v) => v * 6)
 */
export function usePointerParallax(enabled: boolean): { x: MotionValue<number>; y: MotionValue<number> } {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, FOLLOW);
  const y = useSpring(rawY, FOLLOW);

  useEffect(() => {
    if (!enabled || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      rawX.set(0);
      rawY.set(0);
    };
  }, [enabled, rawX, rawY]);

  return { x, y };
}
