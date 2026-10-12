import type { Components, Theme } from "@mui/material/styles";
import { focusRing } from "./Button";

/** Quintal CssBaseline styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalCssBaseline = {
  styleOverrides: {
    body: { backgroundImage: "url('/brand/paper-grain.png')", fontSize: "17px" },
    ":focus-visible": focusRing,
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animation: "none !important",
        transition: "none !important",
        scrollBehavior: "auto !important",
      },
    },
  },
} satisfies Components<Theme>["MuiCssBaseline"];
