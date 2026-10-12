import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";
import { buttonStyles } from "./Button";

/** Quintal ToggleButton styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalToggleButton = {
  styleOverrides: {
    root: { ...buttonStyles, "&.Mui-selected, &.Mui-selected:hover": { backgroundColor: c.grama, color: c.tinta } },
  },
} satisfies Components<Theme>["MuiToggleButton"];
