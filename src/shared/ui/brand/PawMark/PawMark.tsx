import type { SVGProps } from "react";

export interface PawMarkProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Lado em px. */
  size?: number;
}

/**
 * Patinha de traço de mão, decorativa (`aria-hidden`): pet sem foto e "Apresentar outro pet" (spec 020).
 * Usa a cor do texto (`currentColor`).
 *
 * @example <PawMark size={40} />
 */
export function PawMark({ size = 32, ...props }: PawMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <ellipse cx="6.2" cy="9.6" rx="1.9" ry="2.4" transform="rotate(-18 6.2 9.6)" />
      <ellipse cx="10" cy="6.2" rx="1.9" ry="2.5" transform="rotate(-6 10 6.2)" />
      <ellipse cx="14.3" cy="6.3" rx="1.9" ry="2.5" transform="rotate(8 14.3 6.3)" />
      <ellipse cx="18" cy="9.9" rx="1.9" ry="2.4" transform="rotate(20 18 9.9)" />
      <path d="M12.1 11.2c2.6-.1 5.2 3 5.3 5.4.1 2-1.6 3-3 2.7-1-.2-1.6-.8-2.4-.8s-1.4.6-2.4.8c-1.5.3-3.1-.7-3-2.7.2-2.4 2.8-5.3 5.5-5.4Z" />
    </svg>
  );
}
