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
/** Chip marcado (`ChipPicker`): fundo grama com texto tinta. */
export const okChipVariant = { props: { variant: "ok" as const }, style: { backgroundColor: c.grama } };
