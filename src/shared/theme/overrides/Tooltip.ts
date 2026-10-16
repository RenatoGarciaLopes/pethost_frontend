import { quintalRadii } from "@/shared/theme/tokens/radii";
import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";

/** Quintal Tooltip styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalTooltip = {
  styleOverrides: {
    tooltip: { backgroundColor: c.tinta, color: c.papel, fontSize: "1rem", borderRadius: `${quintalRadii.control}px` },
  },
} satisfies Components<Theme>["MuiTooltip"];
