import type { Components, Theme } from "@mui/material/styles";
import { surfaceStyles } from "./surfaces";

/** Quintal Card styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalCard = { styleOverrides: { root: surfaceStyles } } satisfies Components<Theme>["MuiCard"];
