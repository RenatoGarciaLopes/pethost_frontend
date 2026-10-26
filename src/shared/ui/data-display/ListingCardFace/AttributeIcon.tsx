import type { SVGProps } from "react";

/** Atributo de casa que ganha ícone na linha do card. */
export type AttributeIconName = "yard" | "house" | "apartment" | "fast" | "experienced" | "rated";

const paths: Record<AttributeIconName, string[]> = {
  yard: ["M3 20h18", "M6 20V9m4 11V9m4 11V9m4 11V9", "M4 9l2-3 2 3m2 0 2-3 2 3m2 0 2-3 2 3"],
  house: ["M4 11 12 4l8 7", "M6 10v10h12V10", "M10 20v-5h4v5"],
  apartment: ["M6 3h12v18H6z", "M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2", "M3 21h18"],
  fast: ["M13 3 5 13h6l-1 8 8-10h-6z"],
  experienced: ["M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"],
  rated: ["M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"],
};

/** Ícone de traço de 16 px, decorativo (o texto ao lado diz o que é). @example <AttributeIcon name="yard" /> */
export function AttributeIcon({ name, ...props }: { name: AttributeIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
