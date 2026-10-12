import { quintalColors as c } from "../tokens/colors";
/** Secondary low-emphasis action, retaining an accessible touch target. */
export const quietVariant = {
  props: { variant: "quiet" as const },
  style: {
    backgroundColor: "transparent",
    boxShadow: "none",
    borderColor: "transparent",
    "&:hover": { backgroundColor: c.cartao, boxShadow: "none", borderColor: "transparent" },
  },
};
/** Semantic chip variants with ink text on light colored surfaces. */
export const chipVariants = [
  { props: { variant: "sticker" as const }, style: { backgroundColor: c.gema } },
  { props: { variant: "ok" as const }, style: { backgroundColor: c.grama } },
  { props: { variant: "attention" as const }, style: { backgroundColor: c.luz } },
];
/** Panel surface used by forms and previews. */
export const panelVariant = { props: { variant: "panel" as const }, style: { backgroundColor: c.cartao, padding: 24 } };
