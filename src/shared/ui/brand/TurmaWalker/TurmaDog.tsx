"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/shared/lib/motion/usePrefersReducedMotion";
import { TURMA_ASPECT, turmaSrc, type TurmaMember } from "../turma";
import { turmaPosters } from "../turmaPosters";

export interface TurmaDogProps {
  member: TurmaMember;
  /** Height in pixels. */
  height: number;
  /** Show only the embedded first frame; defaults to prefers-reduced-motion. */
  still?: boolean;
}

/** Real first frame is embedded in SSR; replace it only after the animated WebP decodes.
 * Failed or cancelled downloads retain the dog. Reduced motion makes no extra request.
 * @example <TurmaDog member="corgi" height={84} />
 */
export function TurmaDog({ member, height, still }: TurmaDogProps) {
  const reducedMotion = usePrefersReducedMotion();
  const stationary = still ?? reducedMotion;
  const source = turmaSrc(member);
  const [readySource, setReadySource] = useState<string | null>(null);
  useEffect(() => {
    if (stationary) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = async () => {
      try {
        await image.decode();
        if (!cancelled) setReadySource(source);
      } catch {
        // Retain the actual first frame when decoding fails.
      }
    };
    image.src = source;
    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [source, stationary]);
  return (
    <Image
      src={!stationary && readySource === source ? source : turmaPosters[member]}
      alt=""
      aria-hidden="true"
      width={Math.round(height * TURMA_ASPECT)}
      height={height}
      unoptimized
      loading="eager"
      fetchPriority="high"
      draggable={false}
      onError={() => setReadySource(null)}
      style={{ display: "block" }}
    />
  );
}
