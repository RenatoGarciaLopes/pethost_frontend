import { quintalColors as c } from "@/shared/theme/tokens/colors";
import type { HomeType } from "../../../types";

/**
 * Desenho decorativo da casa ou do prédio nos cartões de "Sua casa é…", no traço do cadastro (`RegisterChoice`). O
 * rótulo do cartão carrega a informação.
 * @example <HomeIllustration type="house" />
 */
export function HomeIllustration({ type }: { type: HomeType }) {
  return (
    <svg
      viewBox="0 0 64 52"
      width="56"
      height="46"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={c.tinta}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "house" ? (
        <>
          <path d="M8 22 32 5l24 17Z" fill={c.gema} />
          <path d="M13 22h38v26H13Z" fill="white" />
          <path d="M25 48V34a7 7 0 0 1 14 0v14" fill={c.coral} />
          <path d="M4 48h56" />
        </>
      ) : (
        <>
          <path d="M18 4h28v44H18Z" fill="white" />
          <path d="M24 11h5v5h-5Zm11 0h5v5h-5ZM24 22h5v5h-5Zm11 0h5v5h-5Z" fill={c.ceu} />
          <path d="M27 48V38h10v10" fill={c.coral} />
          <path d="M8 48h48" />
        </>
      )}
    </svg>
  );
}
