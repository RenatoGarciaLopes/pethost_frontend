import type { Components, Theme } from "@mui/material/styles";
import { inputStyles } from "./surfaces";

/** Quintal OutlinedInput styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalOutlinedInput = {
  styleOverrides: { root: inputStyles },
} satisfies Components<Theme>["MuiOutlinedInput"];
