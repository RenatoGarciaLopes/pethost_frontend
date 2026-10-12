import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";

/** Quintal TextField styling; compose through quintalTheme instead of per-feature overrides. */
export const quintalTextField = {
  defaultProps: { variant: "outlined", slotProps: { inputLabel: { shrink: true } } },
  styleOverrides: {
    root: {
      paddingTop: 28,
      "& .MuiInputLabel-root": { transform: "none", color: c.tinta, fontWeight: 700 },
      "& legend": { display: "none" },
    },
  },
} satisfies Components<Theme>["MuiTextField"];
