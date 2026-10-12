"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { TURMA_ASPECT, turmaSrc, type TurmaMember } from "../turma";

export interface TurmaDogProps {
  member: TurmaMember;
  /** Altura em px. */
  height: number;
  /** Força parado (primeiro quadro). Sem a prop, para sozinho com `prefers-reduced-motion`. */
  still?: boolean;
}

/**
 * Um cachorro da turma. O WebP é animado (anda no lugar); com movimento reduzido, mostra só
 * o primeiro quadro desenhado num canvas. Sempre decorativo (`alt=""`).
 *
 * @example <TurmaDog member="corgi" height={84} />
 */
export function TurmaDog({ member, height, still }: TurmaDogProps) {
  const reducedMotion = usePrefersReducedMotion();
  const width = Math.round(height * TURMA_ASPECT);
  if (still ?? reducedMotion) return <StillFrame src={turmaSrc(member)} width={width} height={height} />;
  return (
    <Image
      src={turmaSrc(member)}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      unoptimized
      draggable={false}
      style={{ display: "block" }}
    />
  );
}

function StillFrame({ src, width, height }: { src: string; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => {
      const context = canvasRef.current?.getContext("2d");
      context?.clearRect(0, 0, width, height);
      context?.drawImage(image, 0, 0, width, height);
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} aria-hidden="true" style={{ display: "block" }} />;
}
