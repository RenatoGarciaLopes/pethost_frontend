"use client";
import type { ReactElement, SVGProps } from "react";

/** Tons de feedback da PetHost (REQ-DS-013). `atencao` nunca é vermelho; `erro` tem cor própria. */
export type FeedbackTone = "info" | "ok" | "atencao" | "erro";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/** "i" dentro de um círculo levemente torto (traço de mão). */
export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8c5.2.1 9.2 4 9.1 9.3-.1 5.1-4.2 9.1-9.3 9-5.1-.1-9-4.2-8.9-9.3.1-5 4.1-9.1 9.1-9Z" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Visto de "ok". */
export function OkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8c5.2.1 9.2 4 9.1 9.3-.1 5.1-4.2 9.1-9.3 9-5.1-.1-9-4.2-8.9-9.3.1-5 4.1-9.1 9.1-9Z" />
      <path d="m7.6 12.4 3 3 5.9-6.6" />
    </svg>
  );
}

/** Triângulo de atenção, arredondado. */
export function AttentionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.4 3.9c.7-1.2 2.5-1.2 3.2 0l7.6 13.6c.7 1.2-.2 2.7-1.6 2.7H4.4c-1.4 0-2.3-1.5-1.6-2.7Z" />
      <path d="M12 9v4.6" />
      <circle cx="12" cy="16.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** "×" dentro de um círculo: erro real. */
export function ErrorIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8c5.2.1 9.2 4 9.1 9.3-.1 5.1-4.2 9.1-9.3 9-5.1-.1-9-4.2-8.9-9.3.1-5 4.1-9.1 9.1-9Z" />
      <path d="m8.8 8.8 6.4 6.4M15.2 8.8l-6.4 6.4" />
    </svg>
  );
}

/** Lâmpada da dica. */
export function HintIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3c3.6 0 6.2 2.7 6.1 6.1 0 2.3-1.3 3.7-2.4 4.9-.6.6-.9 1.3-.9 2.1H9.2c0-.8-.3-1.5-.9-2.1C7.2 12.8 5.9 11.4 5.9 9.1 5.8 5.7 8.4 3 12 3Z" />
    </svg>
  );
}

/** Ícone de cada tom (o ícone sempre acompanha a cor, nunca só a cor). */
export const toneIcon: Record<FeedbackTone, (props: IconProps) => ReactElement> = {
  info: InfoIcon,
  ok: OkIcon,
  atencao: AttentionIcon,
  erro: ErrorIcon,
};
