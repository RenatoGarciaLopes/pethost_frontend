import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";
import { hardShadow } from "../tokens/shadows";
import { focusRing } from "./Button";
import { okChipVariant } from "../variants/quintalVariants";

/** Quintal Chip styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalChip = {
  styleOverrides: {
    root: {
      border: `2px solid ${c.tinta}`,
      boxShadow: hardShadow(3),
      minHeight: 48,
      color: c.tinta,
      "&:focus-visible": focusRing,
    },
  },
  variants: [okChipVariant],
} satisfies Components<Theme>["MuiChip"];
