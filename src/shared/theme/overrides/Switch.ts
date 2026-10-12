import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";
import { focusRing } from "./Button";

/** Quintal Switch styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalSwitch = {
  styleOverrides: {
    root: { minHeight: 48, width: 64, "&:has(input:focus-visible)": focusRing },
    track: { border: `2px solid ${c.tinta}`, backgroundColor: c.linha, opacity: 1 },
    switchBase: {
      "&.Mui-checked": { color: c.tinta, "& + .MuiSwitch-track": { backgroundColor: c.grama, opacity: 1 } },
    },
  },
} satisfies Components<Theme>["MuiSwitch"];
