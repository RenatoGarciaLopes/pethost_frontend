import type { Components, Theme } from "@mui/material/styles";
import { surfaceStyles } from "./surfaces";

/** Quintal Paper styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalPaper = {
  styleOverrides: { root: surfaceStyles },
} satisfies Components<Theme>["MuiPaper"];
