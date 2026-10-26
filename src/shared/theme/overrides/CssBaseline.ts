import type { Components, Theme } from "@mui/material/styles";
import { focusRing, keyboardFocus } from "../focus";

/** Quintal CssBaseline styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalCssBaseline = {
  styleOverrides: {
    ":root": { "--app-header-height": "80px", "@media (max-width: 899.95px)": { "--app-header-height": "74px" } },
    "#conteudo, #como-funciona": { scrollMarginTop: "calc(var(--app-header-height, 0px) + 16px)" },
    body: { backgroundImage: "url('/brand/paper-grain.png')", fontSize: "17px" },
    // Also remove native pointer outlines on editable fields before applying keyboard styles.
    ":focus": { outline: "none" },
    [keyboardFocus(":focus-visible")]: focusRing,
    // InputBase resets outline on :focus; keep the keyboard indicator above that reset.
    [keyboardFocus(".MuiInputBase-root .MuiInputBase-input:focus-visible")]: focusRing,
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animation: "none !important",
        transition: "none !important",
        scrollBehavior: "auto !important",
      },
    },
  },
} satisfies Components<Theme>["MuiCssBaseline"];
