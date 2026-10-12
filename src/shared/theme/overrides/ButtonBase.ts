import type { Components, Theme } from "@mui/material/styles";
import { focusRing } from "./Button";

/** Quintal ButtonBase styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalButtonBase = {
  styleOverrides: { root: { "&:focus-visible": focusRing } },
} satisfies Components<Theme>["MuiButtonBase"];
