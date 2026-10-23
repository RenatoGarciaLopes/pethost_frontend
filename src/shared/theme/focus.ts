import { quintalColors } from "./tokens/colors";

/** Attribute maintained by useInputModality on the document root, without React state. */
export const INPUT_MODALITY_ATTRIBUTE = "data-input";

/** Ink geometry shared by keyboard indicators; always compose under keyboardFocus(). */
export const focusRing = { outline: `3px solid ${quintalColors.tinta}`, outlineOffset: "3px" };

/**
 * Gates a CSS selector by real input modality. Native :focus-visible alone also matches
 * pointer-focused text fields. Use the default in sx/overrides and an explicit selector
 * for CssBaseline, hidden inputs or compound cells.
 * @example { [keyboardFocus("&:has(:focus-visible)")]: focusRing }
 */
export function keyboardFocus(selector = "&:focus-visible"): string {
  // Keep existing specificity, including intentional outline suppression on step headings.
  return `:where(html[${INPUT_MODALITY_ATTRIBUTE}="keyboard"]) ${selector}`;
}
