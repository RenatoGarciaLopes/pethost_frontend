import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";

/**
 * Links em tinta com sublinhado coral. Texto coral sobre papel ou branco fica perto de 3:1,
 * abaixo do AA para texto comum; a cor da marca vai no sublinhado, que não precisa de contraste de texto.
 * Foco visível com a cor `foco` (REQ-DS-005).
 */
export const quintalLink: Components<Theme>["MuiLink"] = {
  defaultProps: { underline: "always" },
  styleOverrides: {
    root: {
      color: c.tinta,
      fontWeight: 700,
      textDecorationColor: c.coral,
      textDecorationThickness: 2,
      textUnderlineOffset: 3,
      "&:hover": { textDecorationThickness: 3 },
      "&:focus-visible": { outline: `3px solid ${c.foco}`, outlineOffset: 2, borderRadius: 4 },
    },
  },
};
