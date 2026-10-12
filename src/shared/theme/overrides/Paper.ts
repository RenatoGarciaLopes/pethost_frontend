import type { Components, Theme } from "@mui/material/styles";
import { surfaceStyles } from "./surfaces";
import { panelVariant } from "../variants/quintalVariants";

/** Quintal Paper styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalPaper = {
  styleOverrides: { root: surfaceStyles },
  variants: [panelVariant],
} satisfies Components<Theme>["MuiPaper"];
