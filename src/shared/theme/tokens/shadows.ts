import { quintalColors } from "./colors";
/** Hard shadows for Quintal surfaces; use 0 for pressed states, never Material blur. */
export function hardShadow(offset: 0 | 3 | 5 | 8): string {
  return `${offset}px ${offset}px 0 ${quintalColors.tinta}`;
}
